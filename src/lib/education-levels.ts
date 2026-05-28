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

  // --- UNIVERSITY (Nhóm ngành cơ bản) ---
  {
    id: "uni_it",
    name: "Đại học - Công nghệ thông tin",
    type: "UNIVERSITY",
    subjects: [
      { id: "uni_it_cs", name: "Khoa học máy tính" },
      { id: "uni_it_se", name: "Kỹ thuật phần mềm" },
      { id: "uni_it_network", name: "Mạng máy tính" },
      { id: "uni_it_ai", name: "Trí tuệ nhân tạo" },
      { id: "uni_it_db", name: "Cơ sở dữ liệu" },
      { id: "uni_it_security", name: "An toàn thông tin" }
    ]
  },
  {
    id: "uni_econ",
    name: "Đại học - Kinh tế & Quản trị",
    type: "UNIVERSITY",
    subjects: [
      { id: "uni_eco_micro", name: "Kinh tế vi mô" },
      { id: "uni_eco_macro", name: "Kinh tế vĩ mô" },
      { id: "uni_eco_finance", name: "Tài chính - Ngân hàng" },
      { id: "uni_eco_marketing", name: "Marketing" },
      { id: "uni_eco_accounting", name: "Kế toán - Kiểm toán" }
    ]
  },
  {
    id: "uni_med",
    name: "Đại học - Y Dược",
    type: "UNIVERSITY",
    subjects: [
      { id: "uni_med_anatomy", name: "Giải phẫu học" },
      { id: "uni_med_pharma", name: "Dược lý học" },
      { id: "uni_med_pathology", name: "Sinh lý bệnh" },
      { id: "uni_med_internal", name: "Nội khoa" },
      { id: "uni_med_surgery", name: "Ngoại khoa" }
    ]
  },
  {
    id: "uni_lang",
    name: "Đại học - Ngôn ngữ & Xã hội",
    type: "UNIVERSITY",
    subjects: [
      { id: "uni_lang_eng", name: "Ngôn ngữ Anh" },
      { id: "uni_lang_jap", name: "Ngôn ngữ Nhật" },
      { id: "uni_lang_kor", name: "Ngôn ngữ Hàn" },
      { id: "uni_lang_psy", name: "Tâm lý học" },
      { id: "uni_lang_law", name: "Luật học" }
    ]
  },
  {
    id: "uni_eng",
    name: "Đại học - Kỹ thuật & Công nghệ",
    type: "UNIVERSITY",
    subjects: [
      { id: "uni_eng_mech", name: "Cơ khí" },
      { id: "uni_eng_elec", name: "Điện - Điện tử" },
      { id: "uni_eng_civil", name: "Xây dựng" },
      { id: "uni_eng_auto", name: "Tự động hóa" }
    ]
  }
];
