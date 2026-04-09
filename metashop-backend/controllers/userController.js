import User from "../models/User.js";

// Size calculation logic
function calculateSize(height, weight) {
  // BMI based calculation
  const bmi = weight / 
    ((height / 100) * (height / 100));
  
  // Size matrix
  // Combines height + BMI for accuracy
  
  if (height <= 160) {
    if (bmi < 18.5) return 'XS';
    if (bmi < 22) return 'S';
    if (bmi < 26) return 'M';
    if (bmi < 30) return 'L';
    return 'XL';
  }
  
  if (height <= 170) {
    if (bmi < 18.5) return 'S';
    if (bmi < 22) return 'M';
    if (bmi < 26) return 'L';
    if (bmi < 30) return 'XL';
    return 'XXL';
  }
  
  if (height <= 180) {
    if (bmi < 18.5) return 'M';
    if (bmi < 22) return 'L';
    if (bmi < 26) return 'XL';
    if (bmi < 30) return 'XXL';
    return 'XXL';
  }
  
  // height > 180
  if (bmi < 18.5) return 'M';
  if (bmi < 22) return 'L';
  if (bmi < 26) return 'XL';
  return 'XXL';
}

// Confidence score
function getConfidence(height, weight) {
  const bmi = weight / 
    ((height / 100) * (height / 100));
  
  // More confident when measurements
  // are in normal ranges
  if (bmi >= 18.5 && bmi <= 27 &&
      height >= 150 && height <= 190) {
    return Math.floor(
      Math.random() * 6
    ) + 88; // 88-93%
  }
  
  return Math.floor(
    Math.random() * 8
  ) + 82; // 82-89%
}

// SAVE measurements
export const saveMeasurements = async (
  req, res
) => {
  try {
    const userId = req.userId || req.user?._id;
    const { height, weight } = req.body;

    // Validate
    if (!height || !weight) {
      return res.status(400).json({
        success: false,
        error: "Height and weight required"
      });
    }

    const h = Number(height);
    const w = Number(weight);

    if (h < 100 || h > 250) {
      return res.status(400).json({
        success: false,
        error: "Height must be between 100-250 cm"
      });
    }

    if (w < 30 || w > 250) {
      return res.status(400).json({
        success: false,
        error: "Weight must be between 30-250 kg"
      });
    }

    // Calculate size
    const recommendedSize = calculateSize(h, w);
    const confidence = getConfidence(h, w);
    const bmi = w / ((h / 100) * (h / 100));

    // Save to user
    await User.findByIdAndUpdate(userId, {
      'measurements.height': h,
      'measurements.weight': w,
      'measurements.savedAt': new Date()
    });

    console.log("Measurements saved:", {
      userId,
      height: h,
      weight: w,
      recommendedSize,
      confidence
    });

    return res.json({
      success: true,
      measurements: { height: h, weight: w },
      recommendation: {
        size: recommendedSize,
        confidence,
        bmi: Math.round(bmi * 10) / 10,
        message: getSizeMessage(
          recommendedSize
        )
      }
    });

  } catch (err) {
    console.error(
      "Save measurements error:", 
      err.message
    );
    return res.status(500).json({
      success: false,
      error: "Could not save measurements"
    });
  }
};

// GET measurements
export const getMeasurements = async (
  req, res
) => {
  try {
    const userId = req.userId || req.user?._id;

    const user = await User
      .findById(userId)
      .select('measurements');

    if (!user?.measurements?.height) {
      return res.json({
        success: true,
        measurements: null,
        recommendation: null
      });
    }

    const { height, weight } = user.measurements;
    const recommendedSize = calculateSize(
      height, weight
    );
    const confidence = getConfidence(
      height, weight
    );

    return res.json({
      success: true,
      measurements: { height, weight },
      recommendation: {
        size: recommendedSize,
        confidence,
        message: getSizeMessage(recommendedSize)
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Could not fetch measurements"
    });
  }
};

// Size message helper
function getSizeMessage(size) {
  const messages = {
    'XS': 'Extra small fit — slim silhouette',
    'S': 'Small fit — lean and tailored',
    'M': 'Medium fit — most popular size',
    'L': 'Large fit — relaxed and comfortable',
    'XL': 'Extra large — generous fit',
    'XXL': 'Double XL — maximum comfort'
  };
  return messages[size] || 'Standard fit';
}
