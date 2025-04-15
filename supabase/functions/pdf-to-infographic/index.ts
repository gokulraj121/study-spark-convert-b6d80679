
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Read the file 
    const fileData = await file.arrayBuffer();
    
    // Log file info for debugging
    console.log(`Processing PDF to infographic: ${file.name}, size: ${file.size} bytes`);
    
    // In a real implementation, this would use an AI service to convert the PDF to an infographic
    // For now, we'll just simulate processing time and return a placeholder
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Determine which placeholder to use based on file name 
    // (in a real implementation, this would be based on actual content analysis)
    let placeholderUrl = '';
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('financial') || fileName.includes('finance')) {
      placeholderUrl = "https://via.placeholder.com/800x600/0073CF/FFFFFF?text=Financial+Report+Infographic";
    } else if (fileName.includes('marketing') || fileName.includes('market')) {
      placeholderUrl = "https://via.placeholder.com/800x600/EA4335/FFFFFF?text=Marketing+Strategy+Infographic";
    } else if (fileName.includes('research') || fileName.includes('study')) {
      placeholderUrl = "https://via.placeholder.com/800x600/34A853/FFFFFF?text=Research+Study+Infographic";
    } else if (fileName.includes('education') || fileName.includes('learning')) {
      placeholderUrl = "https://via.placeholder.com/800x600/FBBC05/FFFFFF?text=Educational+Content+Infographic";
    } else {
      placeholderUrl = "https://via.placeholder.com/800x600/8E44AD/FFFFFF?text=Document+Infographic";
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "PDF successfully converted to infographic",
        url: placeholderUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing PDF to infographic:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to convert PDF to infographic" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
