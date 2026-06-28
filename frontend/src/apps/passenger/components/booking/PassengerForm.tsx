import { useForm, useFieldArray, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Field } from "../../../../shared/components/ui/Field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shared/components/ui/select";
import { useConfirmBooking } from "../../../../shared/api/bookings.api";
import { extractError } from "../../../../shared/utils/extractError";

// ─── Schema ──────────────────────────────────────────────────────────────────

const passengerSchema = z.object({
  seatId: z.string(),
  name: z.string().min(2, "Name required"),
  age: z.coerce.number().int().positive("Valid age required").max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

const formSchema = z.object({
  passengers: z.array(passengerSchema),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

interface PassengerFormProps {
  holdId: string;
  seatIds: string[];
  seatNumberMap: Record<string, number>;
  onSuccess: (pnr: string) => void;
}

export function PassengerForm({
  holdId,
  seatIds,
  seatNumberMap,
  onSuccess,
}: PassengerFormProps) {
  const confirmBooking = useConfirmBooking();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      passengers: seatIds.map((seatId) => ({
        seatId,
        name: "",
        age: undefined as unknown as number,
        gender: "MALE" as const,
      })),
    },
  });

  const { fields } = useFieldArray({ control, name: "passengers" });

  async function onSubmit(values: FormValues) {
    try {
      const result = await confirmBooking.mutateAsync({
        holdId,
        passengers: values.passengers,
      });
      onSuccess(result.pnr);
    } catch (err) {
      setError("root", { message: extractError(err) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {fields.map((field, i) => (
        <div
          key={field.id}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          {/* Passenger card header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Passenger {i + 1}
                </p>
                <p className="text-xs text-slate-400">
                  Enter details as on ID proof
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-brand-light rounded-lg px-3 py-1.5">
              <span className="text-xs font-bold text-brand-primary tabular-nums">
                Seat #{seatNumberMap[field.seatId] ?? "?"}
              </span>
            </div>
          </div>

          {/* Fields */}
          <div className="p-6">
            <input type="hidden" {...register(`passengers.${i}.seatId`)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Field
                  label="Full Name"
                  required
                  error={errors.passengers?.[i]?.name?.message}
                >
                  <Input
                    {...register(`passengers.${i}.name`)}
                    placeholder="As on ID proof"
                  />
                </Field>
              </div>
              <Field
                label="Age"
                required
                error={errors.passengers?.[i]?.age?.message}
              >
                <Input
                  type="number"
                  {...register(`passengers.${i}.age`)}
                  placeholder="25"
                  min={1}
                  max={120}
                />
              </Field>
              <div className="sm:col-span-1">
                <Field
                  label="Gender"
                  required
                  error={errors.passengers?.[i]?.gender?.message}
                >
                  <Controller
                    control={control}
                    name={`passengers.${i}.gender`}
                    render={({ field: genderField }) => (
                      <Select
                        value={genderField.value}
                        onValueChange={genderField.onChange}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Root error */}
      {errors.root && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {errors.root.message}
        </div>
      )}

      {/* Submit */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base font-semibold bg-brand-accent hover:bg-brand-accentHov text-white shadow-md transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Confirming your booking…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Confirm Booking
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
        <p className="text-center text-xs text-slate-400 mt-2.5">
          Your PNR will be generated immediately upon confirmation
        </p>
      </div>
    </form>
  );
}
