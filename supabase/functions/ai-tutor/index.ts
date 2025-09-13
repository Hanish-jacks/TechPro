import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

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
    const { message } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Received message:', message);

    const systemPrompt = `You are an AI tutor that helps students with academics and coding. Your role is to:
1. Answer academic questions in subjects like math, science, and engineering with clear explanations and step-by-step reasoning.
2. Help with coding by explaining concepts, debugging errors, and writing beginner-friendly code in languages such as Python, C, C++, Java, and JavaScript.
3. Provide examples that are simple to understand, but also offer advanced explanations if asked.
4. Be interactive: ask clarifying questions if the user's query is vague.
5. Always keep responses educational, supportive, and beginner-friendly. Avoid giving just the final answer—explain the "why" and "how."
6. When showing code, format it properly using markdown code blocks.
7. Be patient and motivating, like a tutor who encourages learning.

Keep responses concise but thorough. Focus on teaching rather than just providing answers.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `Student question: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const tutorResponse = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ response: tutorResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-tutor function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while processing your request' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});