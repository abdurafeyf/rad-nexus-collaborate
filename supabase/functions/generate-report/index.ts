
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded API key instead of environment variable
const OPENAI_API_KEY = "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";

// Function to validate and fetch the image with timeout
async function validateAndFetchImage(imageUrl) {
  try {
    // Add cache busting parameter to avoid potential caching issues
    const urlWithNoCaching = `${imageUrl}?t=${Date.now()}`;
    console.log(`Attempting to fetch image from: ${urlWithNoCaching}`);
    
    // Create a timeout promise
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Image download timed out after 10 seconds")), 10000)
    );
    
    // Create fetch promise
    const fetchPromise = fetch(urlWithNoCaching, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });
    
    // Race the fetch against the timeout
    const response = await Promise.race([fetchPromise, timeout]);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Check content type to verify it's an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`URL does not point to a valid image. Content-Type: ${contentType}`);
    }
    
    console.log("Image fetched successfully");
    return urlWithNoCaching;
  } catch (error) {
    console.error(`Error validating image: ${error.message}`);
    throw new Error(`Image validation failed: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const requestBody = await req.json().catch(error => {
      console.error("Error parsing request body:", error);
      throw new Error("Invalid request format. Please check your request body.");
    });
    
    const { imageUrl, patientName, patientId, scanType, fileName } = requestBody;
    
    console.log("Processing request with:", { patientId, fileName, scanType });
    
    if (!imageUrl) {
      console.error("Missing image URL");
      throw new Error("Image URL is required.");
    }
    
    // Validate and fetch the image with timeout protection
    const validatedImageUrl = await validateAndFetchImage(imageUrl);
    
    // Create the prompt for the OpenAI API
    const prompt = `
      You are an expert radiologist reviewing this medical image. 
      Generate a detailed radiology report in markdown format with the following sections:
      
      # Radiology Report
      
      ## Patient Information
      Patient ID: ${patientId || 'N/A'}
      Patient Name: ${patientName || 'N/A'}
      File: ${fileName || 'N/A'}
      Scan Type: ${scanType || 'Unknown'}
      
      ## Analysis
      [Describe the type of scan and what it was performed to evaluate]
      
      ## Findings
      [Describe in detail what is visible in the image, any abnormalities, comparisons to normal anatomy]
      
      ## Impression
      [Provide a professional assessment and diagnosis based on the findings]
    `;
    
    console.log("Calling OpenAI API...");
    
    // Call the OpenAI Vision API with the validated image URL
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
                image_url: { url: validatedImageUrl }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API returned error:", data.error);
      throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
    }
    
    console.log("Report generated successfully");
    const reportText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ report: reportText, report_text: reportText }),
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
