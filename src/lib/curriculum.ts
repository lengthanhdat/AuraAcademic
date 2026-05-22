export const GRADES = [
  "Lớp 12", "Lớp 11", "Lớp 10", "Lớp 9", "Lớp 8", "Lớp 7", 
  "Lớp 6", "Lớp 5", "Lớp 4", "Lớp 3", "Lớp 2", "Lớp 1", 
  "Khác"
];

export const ALL_SUBJECTS = [
  "Toán học", "Ngữ văn", "Tiếng Việt", "Tiếng Anh", "Vật lí", 
  "Hóa học", "Sinh học", "Khoa học tự nhiên", "Lịch sử", 
  "Địa lí", "Khoa học", "GDCD", 
  "Giáo dục Kinh tế và Pháp luật", "Tin học", "Công nghệ", 
  "Đạo đức", "Tự nhiên và Xã hội", "Âm nhạc", "Mĩ thuật", 
  "Giáo dục thể chất", "Hoạt động trải nghiệm", "Quốc phòng và An ninh", 
  "Khác"
];

export const getSubjectsForGrade = (grade: string): string[] => {
  if (["Lớp 1", "Lớp 2", "Lớp 3"].includes(grade)) {
    return ["Toán học", "Tiếng Việt", "Tiếng Anh", "Đạo đức", "Tự nhiên và Xã hội", "Âm nhạc", "Mĩ thuật", "Giáo dục thể chất", "Hoạt động trải nghiệm", "Khác"];
  }
  if (["Lớp 4", "Lớp 5"].includes(grade)) {
    return ["Toán học", "Tiếng Việt", "Tiếng Anh", "Đạo đức", "Lịch sử", "Địa lí", "Khoa học", "Tin học", "Công nghệ", "Âm nhạc", "Mĩ thuật", "Giáo dục thể chất", "Hoạt động trải nghiệm", "Khác"];
  }
  if (["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"].includes(grade)) {
    return ["Toán học", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử", "Địa lí", "GDCD", "Tin học", "Công nghệ", "Âm nhạc", "Mĩ thuật", "Giáo dục thể chất", "Hoạt động trải nghiệm", "Khác"];
  }
  if (["Lớp 10", "Lớp 11", "Lớp 12"].includes(grade)) {
    return ["Toán học", "Ngữ văn", "Tiếng Anh", "Vật lí", "Hóa học", "Sinh học", "Lịch sử", "Địa lí", "Giáo dục Kinh tế và Pháp luật", "Tin học", "Công nghệ", "Quốc phòng và An ninh", "Âm nhạc", "Mĩ thuật", "Giáo dục thể chất", "Hoạt động trải nghiệm", "Khác"];
  }
  return ALL_SUBJECTS;
};
