
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error("Missing OpenAI API key. Please set the OPENAI_API_KEY environment variable.");
    }
    
    // Get request body
    const { imageUrl, patientName, patientId } = await req.json();
    
    if (!imageUrl) {
      throw new Error("Image URL is required.");
    }
    
    // Create the prompt for the OpenAI API
    const prompt = `
      You are an expert radiologist reviewing this medical image. 
      Generate a detailed radiology report in markdown format with the following sections:
      
      # Radiology Report
      
      ## Patient Information
      Patient ID: ${patientId || 'N/A'}
      Patient Name: ${patientName || 'N/A'}
      
      ## Analysis
      [Describe the type of scan and what it was performed to evaluate]
      
      ## Findings
      [Describe in detail what is visible in the image, any abnormalities, comparisons to normal anatomy]
      
      ## Impression
      [Provide a professional assessment and diagnosis based on the findings]
    `;
    
    // Call the OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`OpenAI API error: ${data.error.message}`);
    }
    
    const reportText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ report: reportText }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error generating report:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while generating the report' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
