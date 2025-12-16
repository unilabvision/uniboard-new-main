interface SectionHeaderProps {
  tagline: string;
  title: string;
  description?: string;
  centered?: boolean;
}

export default function SectionHeader({
  tagline,
  title,
  description,
  centered = false,
}: SectionHeaderProps) {
  return (
    <div className={`space-y-4 max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-full text-xs font-medium">
        {tagline}
      </span>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-200">
        {title}
      </h2>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
