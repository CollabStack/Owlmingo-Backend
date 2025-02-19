exports.formatExtractedText = (text) => {
  if (!text) return '';
  
  return text
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters
    .replace(/[^\w\s.,?!-]/g, '')
    // Trim whitespace
    .trim();
};