import React from "react";

interface QuestionCardProps {
  question: string;
  answer: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, answer }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
};

export default QuestionCard;
