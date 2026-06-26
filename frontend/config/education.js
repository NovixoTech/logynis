const educationConfig = {
  Nigeria: {
    levels: ["Secondary School", "Entrance Exams", "Tertiary"],
    subLevels: {
      "Secondary School": ["JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"],
      "Entrance Exams": ["WAEC", "NECO", "JAMB"],
      "Tertiary": ["University", "Polytechnic", "College of Education"],
    },
    subjects: ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "Economics", "Government", "Geography", "Literature", "ICT/Computer Studies", "History", "Civic Education"],
  },
  UK: {
    levels: ["Secondary School", "Sixth Form", "University"],
    subLevels: {
      "Secondary School": ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"],
      "Sixth Form": ["Year 12 (AS-Level)", "Year 13 (A-Level)"],
      "University": ["Undergraduate", "Postgraduate"],
    },
    subjects: ["Mathematics", "English Literature", "English Language", "Biology", "Chemistry", "Physics", "History", "Geography", "Economics", "Computer Science", "Psychology"],
  },
  USA: {
    levels: ["Middle School", "High School", "College"],
    subLevels: {
      "Middle School": ["Grade 6", "Grade 7", "Grade 8"],
      "High School": ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
      "College": ["Undergraduate", "Postgraduate"],
    },
    subjects: ["Mathematics", "English", "Biology", "Chemistry", "Physics", "US History", "World History", "Economics", "Computer Science", "Psychology"],
  },
  India: {
    levels: ["Secondary School", "Higher Secondary", "University"],
    subLevels: {
      "Secondary School": ["Class 9", "Class 10"],
      "Higher Secondary": ["Class 11", "Class 12"],
      "University": ["Undergraduate", "Postgraduate"],
    },
    subjects: ["Mathematics", "English", "Biology", "Chemistry", "Physics", "History", "Geography", "Economics", "Computer Science", "Accountancy"],
  },
  Others: {
    levels: ["Secondary School", "Tertiary Institution"],
    subLevels: {
      "Secondary School": ["Junior Secondary", "Senior Secondary"],
      "Tertiary Institution": ["Undergraduate", "Postgraduate"],
    },
    subjects: ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "Economics", "History", "Geography", "Computer Science"],
  },
};

export const courseFields = [
  "Science", "Technology", "Engineering",
  "Medical/Health Sciences", "Law", "Business/Finance",
  "Arts/Humanities", "Social Sciences", "Education", "Other"
];

export const goals = ["Exams", "Daily Study", "Homework Help"];
export const countries = ["Nigeria", "UK", "USA", "India", "Others"];

export default educationConfig;
