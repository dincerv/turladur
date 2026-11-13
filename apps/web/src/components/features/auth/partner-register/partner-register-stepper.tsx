const STEPS = [
  { id: 1, label: 'Kurumsal Bilgiler' },
  { id: 2, label: 'İletişim Bilgileri' },
] as const;

type PartnerRegisterStepperProps = {
  step: 1 | 2;
};

export function PartnerRegisterStepper({ step }: PartnerRegisterStepperProps) {
  const progress = step === 1 ? 50 : 100;

  return (
    <div className="mb-6" aria-label={`Adım ${step} / 2`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-neutral-900">
          Adım {step}/2:{' '}
          <span className="font-medium text-neutral-600">
            {STEPS[step - 1].label}
          </span>
        </p>
        <p className="text-xs tabular-nums text-neutral-500">{progress}%</p>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={2}
        aria-valuenow={step}
      >
        <div
          className="h-full rounded-full bg-neutral-950 transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-3 flex gap-2">
        {STEPS.map((item) => {
          const active = step === item.id;
          const done = step > item.id;
          return (
            <li
              key={item.id}
              className={`flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors duration-300 ${
                active
                  ? 'border-neutral-900 bg-neutral-950 text-white'
                  : done
                    ? 'border-neutral-300 bg-neutral-100 text-neutral-800'
                    : 'border-neutral-200 bg-white text-neutral-400'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  active
                    ? 'bg-white text-neutral-950'
                    : done
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {item.id}
              </span>
              <span className="truncate text-[11px] font-medium leading-tight">
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
