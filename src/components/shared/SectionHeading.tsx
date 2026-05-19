type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="mb-3 text-sm font-medium text-cyan-300">{eyebrow}</p>
      ) : null}
      <h2 className="gradient-text text-3xl font-semibold text-white sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}
