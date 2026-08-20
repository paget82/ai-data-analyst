const SAMPLE_QUESTIONS = [
  'What are the top 5 states by customer count?',
  'Show monthly revenue for 2017',
  'What is the average review score?',
  'Which product categories sell the most?',
];

interface SampleChipsProps {
  onSelect: (question: string) => void;
}

export function SampleChips({ onSelect }: SampleChipsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-4 animate-fadeSlideIn">
      {SAMPLE_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          className="rounded-pill border border-border-subtle/60 bg-bubble-input px-4 py-2 text-xs sm:text-sm text-slate-300 hover:text-white hover:border-teal-start/60 hover:bg-bubble-input/80 transition-all hover:scale-[1.02]"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
