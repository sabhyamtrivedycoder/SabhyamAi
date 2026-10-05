/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { UserMeasurements, WardrobeItem, AIStyleAdvice } from "../types";

export const fileToPart = async (file: File | Blob): Promise<{ inlineData: { mimeType: string; data: string } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid file data");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mimeType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : (file.type || 'image/png');
    return { inlineData: { mimeType, data: arr[1] } };
};

/**
 * Universal image converter: handles data URLs, File/Blob objects, and external http/https/blob URLs
 */
export const anyImageToPart = async (input: File | Blob | string): Promise<{ inlineData: { mimeType: string; data: string } }> => {
    if (typeof input === 'string') {
        if (input.startsWith('data:')) {
            const arr = input.split(',');
            if (arr.length < 2) throw new Error("Invalid data URL");
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mimeType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : 'image/png';
            return { inlineData: { mimeType, data: arr[1] } };
        }

        // Try direct fetch for http(s) or blob URLs
        try {
            const res = await fetch(input, { mode: 'cors' });
            if (res.ok) {
                const blob = await res.blob();
                return fileToPart(blob);
            }
        } catch (fetchErr) {
            console.warn('Direct fetch failed, falling back to Image element loader:', fetchErr);
        }

        // Fallback: load in Image element with crossOrigin
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error('Could not get canvas context');
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/png');
                    const arr = dataUrl.split(',');
                    resolve({ inlineData: { mimeType: 'image/png', data: arr[1] } });
                } catch (canvasErr) {
                    reject(canvasErr);
                }
            };
            img.onerror = () => reject(new Error(`Failed to load image from: ${input}`));
            img.src = input;
        });
    }

    return fileToPart(input);
};

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or quota limits. Please try a different image.");
    throw new Error(errorMessage);
};

const ai = new GoogleGenAI({ 
    apiKey: process.env.API_KEY || (process.env as any).GEMINI_API_KEY || '',
    httpOptions: {
        headers: {
            'User-Agent': 'aistudio-build',
        }
    }
});

const model = 'gemini-2.5-flash-image';
const textModel = 'gemini-3.8-flash';

import {
    compositeTryOn,
    compositeModelFallback,
    compositePoseFallback
} from '../lib/fittingEngine';

/**
 * Generate full-body model with strict face accuracy & physical measurements
 */
export const generateModelImage = async (userImage: File | string, measurements?: UserMeasurements): Promise<string> => {
    let userImagePart;
    try {
        userImagePart = await anyImageToPart(userImage);
    } catch {
        return await compositeModelFallback(userImage);
    }
    
    const measurementContext = measurements 
        ? `
**PHYSICAL PROPORTIONS & USER SPECIFICATIONS:**
- Height Profile: ${measurements.height}
- Weight / Mass: ${measurements.weight}
- Body Build / Shape: ${measurements.bodyType}
- Target Presentation: ${measurements.gender} styling
- Aesthetic Vibe: ${measurements.styleVibe || 'Modern Chic'}
Accurately structure the full-body model's stature, height, and natural body proportions according to these measurements.
`
        : '';

    const prompt = `You are a world-class high-fashion AI photographer and virtual fitting expert for Sabhyamai. 
Your task is to transform the person in this source photo into an e-commerce full-body fashion model standing in a clean, neutral studio backdrop (light gray, #f0f0f0).

**MANDATORY 100% ACCURATE FACE PRESERVATION (TOP PRIORITY):**
1. EXACT FACE FIDELITY: The person's face MUST BE 100% ACCURATE to the source image. Preserve their exact facial geometry, eyes, eyelids, eye color, nose shape, lip shape, mouth, smile lines, jawline, chin, cheekbones, skin tone, facial hair/beard, eyebrows, hair color, and hair texture.
2. DO NOT ALTER OR SWAP THE FACE: Absolutely NO generic AI model faces, NO beautification filters, NO facial smoothing, and NO ethnicity or age alteration. The person MUST instantly recognize themselves.
${measurementContext}
3. POSE & ATTIRE: Place the person in a relaxed, confident standing model posture facing forward. Clothe them in simple, neutral minimalist base garments (e.g. fitted neutral tank top / tee and fitted neutral pants or trousers) ready for layering clothes on top.
4. PHOTOREALISM: Studio soft-diffused lighting, 8k quality, realistic skin textures, shadows, and natural human anatomy.

Return ONLY the final generated image.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [userImagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return handleApiResponse(response);
    } catch (err: any) {
        console.info('Switching to zero-cost Instant Model Engine (No API fees):', err?.message);
        return await compositeModelFallback(userImage);
    }
};

/**
 * Perform virtual try-on while keeping the person's face 100% untouched
 */
export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentInput: File | string): Promise<string> => {
    try {
        const modelImagePart = await anyImageToPart(modelImageUrl);
        const garmentImagePart = await anyImageToPart(garmentInput);
        
        const prompt = `You are an expert virtual try-on AI for Sabhyamai. You will be given a 'model image' and a 'garment image'. 
Your task is to create a photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'.

**STRICT PRESERVATION RULES:**
1. **UNTOUCHED 1:1 FACE ACCURACY:** The person's face, facial features, expression, eyes, nose, mouth, hair, skin complexion, and head structure from the 'model image' MUST REMAIN 100% UNCHANGED AND ACCURATE. Do NOT touch, morph, blur, or alter any part of their face.
2. **BODY & POSE FIDELITY:** The model's exact height, body silhouette, pose, hands, legs, and background (#f0f0f0 studio) MUST be preserved exactly as shown.
3. **COMPLETE GARMENT REPLACEMENT:** Completely replace the previous clothing with the new garment from the 'garment image'. The new clothing must realistically wrap around their specific body proportions with natural folds, drape, shadows, fabric texture, and authentic seamlines.
4. **OUTPUT:** Return ONLY the final photorealistic image.`;

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return handleApiResponse(response);
    } catch (err: any) {
        console.info('Switching to zero-cost Smart Fitting Engine (No API fees):', err?.message);
        return await compositeTryOn(modelImageUrl, garmentInput);
    }
};

/**
 * Generate pose variation maintaining identity
 */
export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    try {
        const tryOnImagePart = await anyImageToPart(tryOnImageUrl);
        const prompt = `You are an expert fashion photographer AI for Sabhyamai. Take this image and regenerate the exact same person from a new perspective: "${poseInstruction}".
        
**RULES:**
1. The person's face, facial features, identity, hair, and body proportions must be 100% identical.
2. The clothing items and colors must remain identical.
3. Studio lighting and light gray background remain identical.
Return ONLY the final image.`;

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [tryOnImagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        return handleApiResponse(response);
    } catch (err: any) {
        console.info('Switching to zero-cost multi-angle perspective engine:', err?.message);
        return await compositePoseFallback(tryOnImageUrl, poseInstruction);
    }
};

/**
 * AI Style Advisor & Fit Assessment using Gemini 3.8 Flash
 */
export const generateAIStyleAdvice = async (
    styledImageUrl: string,
    garments: WardrobeItem[],
    measurements?: UserMeasurements
): Promise<AIStyleAdvice> => {
    try {
        const imagePart = await anyImageToPart(styledImageUrl);
        const garmentNames = garments.map(g => g.name).join(', ') || 'Styled outfit';
        const bodyContext = measurements 
            ? `Customer Measurements: Height ${measurements.height}, Weight ${measurements.weight}, Build: ${measurements.bodyType}, Style: ${measurements.styleVibe || 'Versatile'}.`
            : 'Standard model fit analysis.';

        const prompt = `You are Sabhyamai's premier fashion stylist and body silhouette consultant.
Analyze this styled outfit (${garmentNames}).
${bodyContext}

Provide a fashion analysis formatted strictly as valid JSON with this exact structure:
{
  "headline": "A punchy, flattering 4-7 word title of this aesthetic",
  "fitAssessment": "A 2-3 sentence personalized critique of how this silhouette and drape complements their height and build",
  "colorScore": 92,
  "occasionSuggestions": ["Cocktail Event", "Smart Casual Dinner", "Creative Office"],
  "stylingTips": ["Pair with minimal silver jewelry", "Opt for structured loafers or sleek Chelsea boots", "Cuff the sleeves slightly for effortless proportion"]
}
Return ONLY pure JSON.`;

        const response = await ai.models.generateContent({
            model: textModel,
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
            }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return {
            headline: parsed.headline || 'Contemporary Silhouette',
            fitAssessment: parsed.fitAssessment || 'The proportions balance the body line naturally with clean vertical lines.',
            colorScore: typeof parsed.colorScore === 'number' ? parsed.colorScore : 90,
            occasionSuggestions: Array.isArray(parsed.occasionSuggestions) ? parsed.occasionSuggestions : ['Daywear', 'Evening Social', 'Casual Outing'],
            stylingTips: Array.isArray(parsed.stylingTips) ? parsed.stylingTips : ['Add structured footwear', 'Accent with metallic accessories']
        };
    } catch (e) {
        console.warn('AI styling analysis fallback triggered:', e);
        return {
            headline: 'Effortless Modern Ensemble',
            fitAssessment: `The clean tailoring flatters ${measurements?.bodyType ? measurements.bodyType.toLowerCase() + ' proportions' : 'your frame'} with balanced visual weight.`,
            colorScore: 88,
            occasionSuggestions: ['City Stroll', 'Casual Gathering', 'Weekend Lounge'],
            stylingTips: ['Balance with neutral sneakers or sleek boots', 'Layer with a tonal watch or subtle chain']
        };
    }
};

export interface BaggyAccessoryAdvice {
    headline: string;
    jewelryTip: string;
    footwearTip: string;
    bagTip: string;
    layeringTip: string;
    silhouetteBalanceSummary: string;
}

/**
 * Generates personalized accessory and footwear advice for the recommended baggy size
 */
export const generateBaggyAccessoryTips = async (
    recommendedSize: string,
    fitStyle: string,
    garmentName: string,
    measurements: { height: string; weight: string; bodyType: string }
): Promise<BaggyAccessoryAdvice> => {
    try {
        const prompt = `You are a celebrity high-fashion streetwear stylist for Sabhyamai.
The customer has a ${measurements.bodyType} build, height ${measurements.height}, and weight ${measurements.weight}.
They were recommended Size ${recommendedSize} (${fitStyle}) for the item: "${garmentName}".

Provide personalized, ultra-stylish advice on how to accessorize and style this specific baggy size.
Structure the answer as pure JSON matching this exact schema:
{
  "headline": "A catchy, stylish 4-6 word title for this accessory vibe",
  "jewelryTip": "Specific guidance on necklaces, rings, and wristwear (e.g. chunky cuban link, silver box chains, minimal pearl accent) that complement this neckline and drape",
  "footwearTip": "Specific shoe styles (e.g., chunky skate shoes, retro runner, platform loafers, lug-sole boots) to balance the oversized leg/torso volume",
  "bagTip": "Bag or headwear recommendations (e.g., tactical crossbody sling, structured canvas tote, vintage fitted cap or low-profile beanie)",
  "layeringTip": "How to layer underneath or over this size (e.g., crisp white hem peeking out, unbuttoned chore coat, or cropped jacket)",
  "silhouetteBalanceSummary": "1 punchy sentence summarizing how these accessories create visual proportion with this baggy size"
}
Return ONLY pure JSON.`;

        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const parsed = JSON.parse(response.text || '{}');
        return {
            headline: parsed.headline || 'Streetwear Proportion Harmony',
            jewelryTip: parsed.jewelryTip || 'Layer a medium-gauge silver box chain to draw the eye vertically along the boxy chest drape.',
            footwearTip: parsed.footwearTip || 'Wear chunky platform sneakers or retro basketball shoes with enough visual weight to anchor the wide hemline.',
            bagTip: parsed.bagTip || 'Throw on an asymmetrical nylon crossbody sling across the chest to break up the oversized surface area.',
            layeringTip: parsed.layeringTip || 'Let 1-2 inches of a heavyweight white base tee peek out beneath the bottom hem for a clean streetwear sandwich.',
            silhouetteBalanceSummary: parsed.silhouetteBalanceSummary || `Accessories with geometric structure balance the breezy volume of your Size ${recommendedSize} fit.`
        };
    } catch (err) {
        console.warn('Fallback accessory tips triggered:', err);
        return {
            headline: 'Modern Urban Streetwear Balance',
            jewelryTip: 'Layer a medium-gauge silver box chain or Cuban link to establish a focal anchor against the boxy chest drape.',
            footwearTip: 'Choose chunky retro skate shoes (e.g. Dunks, Sambas with fat laces, or lug-sole loafers) to balance the wide lower silhouette.',
            bagTip: 'Opt for an adjustable nylon sling or structured canvas tote worn across the shoulder to add tactical depth.',
            layeringTip: 'Keep a clean contrast tee peeking 1.5 inches at the hemline to create a crisp horizontal color break.',
            silhouetteBalanceSummary: `Structured accessories ground the relaxed, voluminous lines of your Size ${recommendedSize} silhouette.`
        };
    }
};

export interface StyleMoodboardPrompt {
    sceneTitle: string;
    settingVibe: string;
    prompt: string;
    colorPalette: string[];
    stylingFocus: string;
}

export interface StyleMoodboard {
    aestheticTitle: string;
    vibeSummary: string;
    prompts: StyleMoodboardPrompt[];
}

/**
 * Generates a Style Moodboard with 4 AI lifestyle image prompts tailored to the outfit aesthetic
 */
export const generateStyleMoodboard = async (
    garments: WardrobeItem[],
    measurements?: UserMeasurements
): Promise<StyleMoodboard> => {
    try {
        const garmentNames = garments.map(g => g.name).join(', ') || 'Baggy Streetwear Capsule';
        const buildInfo = measurements ? `${measurements.bodyType} build, height ${measurements.height}` : 'relaxed streetwear frame';

        const systemPrompt = `You are a high-fashion creative director and lookbook photographer for Sabhyamai.
Analyze this styled outfit: "${garmentNames}".
Model context: ${buildInfo}.

Create a curated 'Style Moodboard' consisting of four cinematic, evocative AI lifestyle image prompts that capture this aesthetic in distinct real-world contexts (e.g., Tokyo neon streetscape, Brutalist concrete coffee lab, Golden hour urban rooftop studio, Underground industrial skate park).

Return strictly valid JSON matching this schema:
{
  "aestheticTitle": "e.g. Neo-Brutalist Streetwear Luxe",
  "vibeSummary": "A 1-2 sentence atmospheric summary of the mood, energy, and subculture of this outfit.",
  "prompts": [
    {
      "sceneTitle": "Short 2-4 word setting title (e.g. Rainy Shibuya Neon)",
      "settingVibe": "Atmospheric description (e.g. Wet asphalt reflections, soft cyan and amber neon glow)",
      "prompt": "Full cinematic image prompt ready for AI generation, detailing model pose, apparel drape, 35mm film grain, Hasselblad medium format shot, natural diffused studio or environmental lighting",
      "colorPalette": ["#1a1a1a", "#4a5568", "#cbd5e1", "#f59e0b"],
      "stylingFocus": "Key visual detail (e.g. Dropped shoulder boxy drape and stacked parachute hem over platform sneakers)"
    }
  ]
}
Make sure there are exactly 4 distinct prompts in the array. Return ONLY pure JSON.`;

        const response = await ai.models.generateContent({
            model: textModel,
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (Array.isArray(parsed.prompts) && parsed.prompts.length >= 4) {
            return parsed;
        }
        throw new Error('Incomplete prompts returned');
    } catch (err) {
        console.warn('Fallback moodboard generated:', err);
        return {
            aestheticTitle: 'Metropolitan Baggy Utility',
            vibeSummary: 'Understated streetwear confidence defined by heavyweight architectural drapes, industrial tones, and nonchalant posture.',
            prompts: [
                {
                    sceneTitle: 'Brutalist Concrete Gallery',
                    settingVibe: 'Monolithic raw concrete walls, soft overcast diffused zenith skylight',
                    prompt: 'Cinematic full-body editorial photo of a person wearing a boxy acid-wash oversized tee and wide-leg cargo pants, standing nonchalantly against a raw brutalist concrete wall, 35mm Kodak Portra 400 grain, soft daylight, directional shadows, effortless fashion magazine look.',
                    colorPalette: ['#1f2937', '#6b7280', '#e5e7eb', '#9ca3af'],
                    stylingFocus: 'Deep drop shoulders with clean geometric boxy body drape'
                },
                {
                    sceneTitle: 'Rainy Shibuya Crossing',
                    settingVibe: 'Wet asphalt reflections, blurred cyan and amber neon signs, misty atmosphere',
                    prompt: 'Urban street-style photograph of a model in an oversized drop-shoulder heavyweight hoodie and baggy parachute pants crossing a rainy Tokyo street at dusk, wet pavement reflections of neon lights, cinematic anamorphic lens bokeh, dynamic stride, high fashion streetwear editorial.',
                    colorPalette: ['#0f172a', '#3b82f6', '#ec4899', '#f8fafc'],
                    stylingFocus: 'Voluminous parachute leg pooling cleanly over chunky retro skate sneakers'
                },
                {
                    sceneTitle: 'Golden Hour Loft Studio',
                    settingVibe: 'Sun-drenched loft with warm raking sunlight, warm oak floors, analog vinyl setup',
                    prompt: 'Candid lifestyle portrait of a person in a minimalist oversized boxy tee and relaxed carpenter denim sitting on a mid-century leather sofa, warm golden-hour window light casting dramatic elongated shadows, soft 50mm f/1.4 lens blur, relaxed authentic smile.',
                    colorPalette: ['#78350f', '#d97706', '#fef3c7', '#374151'],
                    stylingFocus: 'Casual front-half tuck emphasizing waistline and relaxed silhouette'
                },
                {
                    sceneTitle: 'Underground Skate Warehouse',
                    settingVibe: 'Graffiti-textured industrial pillars, moody tungsten rim lights, motion-blur grit',
                    prompt: 'Atmospheric candid photo of a streetwear enthusiast in a relaxed cyberpunk graphic tee and double-knee denim leaning against an industrial steel column, moody tungsten backlighting, film grain, retro skate culture aesthetic, effortless confidence.',
                    colorPalette: ['#18181b', '#ef4444', '#71717a', '#fafafa'],
                    stylingFocus: 'Raw seam details, chunky silver chain necklace, and stacked hem break'
                }
            ]
        };
    }
};

export interface LookComparisonResult {
    headline: string;
    silhouetteContrast: string;
    paletteContrast: string;
    occasionVerdict: string;
    keyDifferences: string[];
    stylistRecommendation: string;
}

/**
 * Compares two saved looks side-by-side using Gemini and generates styling difference analysis
 */
export const compareSavedLooksWithAI = async (
    lookA: any,
    lookB: any
): Promise<LookComparisonResult> => {
    try {
        const garmentsA = lookA.layers?.map((l: any) => l.garment?.name).filter(Boolean).join(', ') || 'Minimalist outfit';
        const garmentsB = lookB.layers?.map((l: any) => l.garment?.name).filter(Boolean).join(', ') || 'Minimalist outfit';

        const prompt = `You are a celebrity high-fashion stylist for Sabhyamai.
Compare these two customer saved outfits:

LOOK A: "${lookA.title || 'First Look'}"
- Garments Worn: ${garmentsA}
- Pose/Perspective: ${lookA.poseInstruction || 'Studio posture'}

LOOK B: "${lookB.title || 'Second Look'}"
- Garments Worn: ${garmentsB}
- Pose/Perspective: ${lookB.poseInstruction || 'Studio posture'}

Analyze the main styling differences between these two outfits. Contrast their proportions, silhouette drape, color harmony, and occasion versatility.
Return strictly valid JSON with this exact schema:
{
  "headline": "A punchy, flattering 4-7 word title contrasting the two looks",
  "silhouetteContrast": "2 sentences contrasting the drape, volume, shoulder drop, and leg pooling",
  "paletteContrast": "1-2 sentences on how the color palette, textures, and visual weight differ",
  "occasionVerdict": "Clear verdict on which settings/events each look suits best",
  "keyDifferences": [
    "Volume & Proportion difference",
    "Layering & Versatility difference",
    "Footwear & Accessory pairing contrast"
  ],
  "stylistRecommendation": "A stylish conclusion on how to wear and rotate between these two looks"
}
Return ONLY pure JSON.`;

        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const parsed = JSON.parse(response.text || '{}');
        return {
            headline: parsed.headline || 'Streetwear Volume vs. Tailored Balance',
            silhouetteContrast: parsed.silhouetteContrast || 'Look A leans into dramatic oversized proportions, whereas Look B keeps a streamlined boxy silhouette.',
            paletteContrast: parsed.paletteContrast || 'Look A features moody urban tones, while Look B balances neutral warmth with crisp contrast.',
            occasionVerdict: parsed.occasionVerdict || 'Look A is ideal for creative streetwear settings, while Look B adapts easily to versatile day-to-night social wear.',
            keyDifferences: Array.isArray(parsed.keyDifferences) ? parsed.keyDifferences : [
                'Upper body ease and drop-shoulder extension are more prominent in Look A',
                'Look B creates longer vertical leg lines with higher hem landing',
                'Distinct accessory and footwear styling weight'
            ],
            stylistRecommendation: parsed.stylistRecommendation || 'Keep Look A for weekend statement wear and Look B for effortless everyday rotation.'
        };
    } catch (err) {
        console.warn('Fallback look comparison generated:', err);
        return {
            headline: 'Dramatic Oversized Drape vs. Clean Minimal Line',
            silhouetteContrast: 'Look A emphasizes heavy drop-shoulder drape and voluminous pooling, while Look B emphasizes tailored boxiness.',
            paletteContrast: 'Tonal contrast ranges from industrial darks in Look A to versatile everyday neutrals in Look B.',
            occasionVerdict: 'Look A excels at street/fashion events, while Look B is ideal for refined daily wear.',
            keyDifferences: [
                'Upper body volume: Look A has greater chest ease and drop-shoulder extension',
                'Hemline landing: Look B sits higher at the hip for a more elongated vertical stature',
                'Styling flexibility: Look B layers more effortlessly under outerwear jackets'
            ],
            stylistRecommendation: 'Pair Look A with chunky skate footwear and Look B with sleek retro runners.'
        };
    }
};