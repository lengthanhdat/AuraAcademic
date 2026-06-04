export interface Subject {
  id: string;
  name: string;
}

export interface EducationLevel {
  id: string;
  name: string;
  type: "K12" | "UNIVERSITY";
  subjects: Subject[];
}

// Cấp Tiểu học (Lớp 1 - 5)
const primarySubjects: Subject[] = [
  { id: "toan", name: "Toán học" },
  { id: "tieng_viet", name: "Tiếng Việt" },
  { id: "tieng_anh", name: "Tiếng Anh" },
  { id: "dao_duc", name: "Đạo đức" },
  { id: "tn_xh", name: "Tự nhiên và Xã hội" },
  { id: "khoa_hoc", name: "Khoa học" },
  { id: "lich_su_dia_li", name: "Lịch sử và Địa lí" },
  { id: "tin_hoc", name: "Tin học" },
  { id: "cong_nghe", name: "Công nghệ" }
];

// Cấp THCS (Lớp 6 - 9)
const secondarySubjects: Subject[] = [
  { id: "toan", name: "Toán học" },
  { id: "ngu_van", name: "Ngữ văn" },
  { id: "tieng_anh", name: "Tiếng Anh" },
  { id: "khtn", name: "Khoa học tự nhiên" },
  { id: "lich_su_dia_li", name: "Lịch sử và Địa lí" },
  { id: "gdcd", name: "Giáo dục công dân" },
  { id: "tin_hoc", name: "Tin học" },
  { id: "cong_nghe", name: "Công nghệ" }
];

// Cấp THPT (Lớp 10 - 12)
const highSchoolSubjects: Subject[] = [
  { id: "toan", name: "Toán học" },
  { id: "ngu_van", name: "Ngữ văn" },
  { id: "tieng_anh", name: "Tiếng Anh" },
  { id: "vat_li", name: "Vật lí" },
  { id: "hoa_hoc", name: "Hóa học" },
  { id: "sinh_hoc", name: "Sinh học" },
  { id: "lich_su", name: "Lịch sử" },
  { id: "dia_li", name: "Địa lí" },
  { id: "gdkt_pl", name: "Giáo dục Kinh tế và Pháp luật" },
  { id: "tin_hoc", name: "Tin học" },
  { id: "cong_nghe", name: "Công nghệ" }
];

export const EDUCATION_HIERARCHY: EducationLevel[] = [
  // --- K-12 ---
  { id: "grade_1", name: "Lớp 1", type: "K12", subjects: primarySubjects },
  { id: "grade_2", name: "Lớp 2", type: "K12", subjects: primarySubjects },
  { id: "grade_3", name: "Lớp 3", type: "K12", subjects: primarySubjects },
  { id: "grade_4", name: "Lớp 4", type: "K12", subjects: primarySubjects },
  { id: "grade_5", name: "Lớp 5", type: "K12", subjects: primarySubjects },
  { id: "grade_6", name: "Lớp 6", type: "K12", subjects: secondarySubjects },
  { id: "grade_7", name: "Lớp 7", type: "K12", subjects: secondarySubjects },
  { id: "grade_8", name: "Lớp 8", type: "K12", subjects: secondarySubjects },
  { id: "grade_9", name: "Lớp 9", type: "K12", subjects: secondarySubjects },
  { id: "grade_10", name: "Lớp 10", type: "K12", subjects: highSchoolSubjects },
  { id: "grade_11", name: "Lớp 11", type: "K12", subjects: highSchoolSubjects },
  { id: "grade_12", name: "Lớp 12", type: "K12", subjects: highSchoolSubjects },

  // --- UNIVERSITY ---
  {
    id: "university",
    name: "Đại học",
    type: "UNIVERSITY",
    subjects: [
      { id: "uni_general", name: "Đại cương" },
      { id: "uni_specialized", name: "Chuyên ngành" },
      { id: "uni_other", name: "Khác" }
    ]
  }
];
