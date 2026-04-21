"use client";

interface StepCardHeaderProps {
  title: string;
  description: string;
}

export function StepCardHeader({ title, description }: StepCardHeaderProps) {
  return (
    <div className="px-6 pt-6 pb-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-0.5 text-sm text-gray-500">{description}</p>
    </div>
  );
}
