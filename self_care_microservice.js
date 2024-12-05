// index.js
const express = require("express")
const dotenv = require("dotenv")
const OpenAI = require("openai")
const rateLimit = require("express-rate-limit")

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})

app.use(limiter)
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to categorize time of day
const getTimeCategory = (timeStr) => {
  const hour = parseInt(timeStr.split(":")[0])
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 21) return "evening"
  return "night"
}

app.post("/wellness-tip", async (req, res) => {
  try {
    const { moods, time } = req.body

    if (!moods || !Array.isArray(moods) || !time) {
      return res.status(400).json({
        error:
          "Invalid request. Please provide moods array and time (HH:MM format)",
      })
    }

    const timeCategory = getTimeCategory(time)
    const moodsStr = moods.join(", ")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a compassionate mental health wellness assistant. Provide short, practical self-care tips that are specific and actionable. Keep responses to 2-3 sentences maximum.",
        },
        {
          role: "user",
          content: `Generate a specific self-care tip for someone who is feeling ${moodsStr} during the ${timeCategory}. Make it practical and actionable. Don't use phrases like "consider" or "try to". Be direct but gentle.`,
        },
      ],
    });
    
    const tip = completion.choices[0].message.content;
    
    return res.json({
      tip,
      moods,
      time,
      timeCategory,
    });
    
  } catch (error) {
    console.error("Error:", error)
    return res.status(500).json({
      error: "Internal server error",
    })
  }
})

app.listen(port, () => {
  console.log(`Wellness tips service running on port ${port}`)
})
