module.exports.validateMemberData = (data) => {
    const errors = [];
  
    if (!data.name || data.name.trim() === "") errors.push("Name is required.");
    if (!data.email || data.email.trim() === "") errors.push("Email is required.");
    if (!data.password || data.password.trim() === "") errors.push("Password is required.");
  
    if (!data.topic1 || data.topic1.trim() === "") errors.push("Topic 1 is required.");
    if (!data.topic2 || data.topic2.trim() === "") errors.push("Topic 2 is required.");
    if (!data.topic3 || data.topic3.trim() === "") errors.push("Topic 3 is required.");
  
    return errors;
  };