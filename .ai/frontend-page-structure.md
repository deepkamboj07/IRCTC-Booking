# Frontend Page & Component Structure

This document defines the **exact structure every new page must follow**. Read this before creating any new page or component.

---

## 1. Folder Layout

```
frontend/src/
├── apps/
│   ├── admin/
│   │   ├── pages/                        ← Thin page shells only, grouped by feature
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── train-booking/
│   │   │   │   ├── TrainListPage.tsx   (if admin-specific; else use shared/)
│   │   │   │   ├── TrainDetailPage.tsx
│   │   │   │   └── TrainFormPage.tsx
│   │   ├── components/
│   │   │   └── <feature>/                ← Feature-specific components (not shared)
│   │   │       ├── constants.ts
│   │   │       ├── FeatureFilters.tsx
│   │   │       ├── FeatureFormSkeleton.tsx
│   │   │       ├── FeatureIdentityBanner.tsx
│   │   │       ├── FeatureForm.tsx
│   │   │       └── tabs/
│   │   │           └── OverviewTab.tsx
│   │   └── types/
│   │       └── feature.types.ts          ← Types used only within this app
│   │
│   └── passenger/
│       ├── pages/                        ← Same sub-folder-per-feature rule
│       │   ├── dashboard/
│       │   │   └── DashboardPage.tsx
│       │   ├── booking/
│       │   │   └── BookingPage.tsx
│       │   └── sessions/
│       │       └── ReceptionActiveSessionPage.tsx
│       ├── components/                   ← Reception-specific components
│       │   ├── BookingFormStep.tsx
│       │   └── ConfirmationStep.tsx
│       └── types/
│           └── booking.types.ts
│
└── shared/
    ├── api/
    │   └── feature.api.ts                ← All React Query hooks + types
    ├── pages/                            ← Pages reused across admin + reception
    │   └── customers/
    │       ├── CustomerListPage.tsx
    │       ├── CustomerFormPage.tsx
    │       └── CustomerProfilePage.tsx
    ├── components/
    │   ├── ui/                           ← shadcn + shared primitives
    │   │   ├── Field.tsx                 ← ALWAYS use this for form fields
    │   │   ├── SectionCard.tsx           ← ALWAYS use this for section cards
    │   │   └── ...
    └── utils/
        └── extractError.ts              ← ALWAYS use this for API errors
```

## 2. The Golden Rule: Pages Are Thin Shells

A page file **must not** contain:
- Form logic or Zod schemas
- API mutation calls (`useMutation`)
- Inline filter UI
- Skeleton loaders
- Identity banners
- Any component longer than ~20 lines

A page file **only** contains:
- Page header (back button, title, subtitle)
- Conditional rendering of feature components
- `useParams` / `useNavigate`
- One or two data fetches needed to pass props to components (e.g. banner data)

## 3. shadcn Components — Install First, Build Never

**Before writing any UI element, check if shadcn has it.**

### Step 1 — Check what's already installed

Look in `frontend/src/shared/components/ui/` for existing components.

Already available: `button`, `input`, `select`, `checkbox`, `badge`, `table`, `calendar`, `popover`, `date-picker`, `data-table`, `form-select`, `Field`, `SectionCard`, `table-pagination`, and more.

### Step 2 — If not installed, install via CLI

```bash
cd fronted
npx shadcn@latest add <component-name>
```

Common components and their install names:

| Need | Command |
|------|---------|
| Dialog / Modal | `npx shadcn@latest add dialog` |
| Tabs | `npx shadcn@latest add tabs` |
| Tooltip | `npx shadcn@latest add tooltip` |
| Dropdown Menu | `npx shadcn@latest add dropdown-menu` |
| Sheet / Drawer | `npx shadcn@latest add sheet` |
| Avatar | `npx shadcn@latest add avatar` |
| Accordion | `npx shadcn@latest add accordion` |
| Separator | `npx shadcn@latest add separator` |
| Skeleton | `npx shadcn@latest add skeleton` |
| Textarea | `npx shadcn@latest add textarea` |
| Switch | `npx shadcn@latest add switch` |
| Radio Group | `npx shadcn@latest add radio-group` |
| Command (cmdk) | `npx shadcn@latest add command` |
| Combobox | `npx shadcn@latest add combobox` |
| Progress | `npx shadcn@latest add progress` |
| Alert | `npx shadcn@latest add alert` |
| Card | `npx shadcn@latest add card` |

### Step 3 — Never hand-roll what shadcn provides

❌ Do NOT write custom modal HTML with `fixed inset-0 z-50 ...`
✅ Install `dialog` and use `<Dialog>` from shadcn

❌ Do NOT write `<div role="tab" ...>` tab markup
✅ Install `tabs` and use `<Tabs>` from shadcn

---

## 4. Shared Primitives — Always Use, Never Duplicate

These are already built. **Never re-create them locally inside a page or component file.**

### `Field` — form field wrapper

```tsx
import { Field } from "../../../../shared/components/ui/Field";

<Field label="Branch Name" required error={errors.name?.message} hint="Optional hint text">
  <Input {...register("name")} />
</Field>
```

Props: `label`, `required?`, `error?`, `hint?`, `children`

### `SectionCard` — section with icon header

```tsx
import { SectionCard } from "../../../../shared/components/ui/SectionCard";

<SectionCard title="Contact Details" icon={<Phone className="w-4 h-4" />}>
  {/* content */}
</SectionCard>
```

Props: `title`, `icon`, `children`, `overflowVisible?`

### `extractError` — API error message

```tsx
import { extractError } from "../../../../shared/utils/extractError";

} catch (err) {
  setError("root", { message: extractError(err) });
}
```

**Never** copy this function locally. It handles Axios response errors, plain Errors, and unknown throws.


## 6. Form Component Pattern

All form components follow this exact pattern:

```tsx
// ─── Schema ──────────────────────────────────────────────────────────────────

const baseSchema = z.object({ ... });
const editSchema = baseSchema.extend({ isActive: z.boolean() });
type FormValues = z.infer<typeof editSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

interface FeatureFormProps {
  featureId?: string;   // undefined = create mode, string = edit mode
}

export function FeatureForm({ featureId }: FeatureFormProps) {
  const navigate = useNavigate();
  const isEdit = !!featureId;

  const { data, isLoading } = useFeature(featureId ?? "");
  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting }, setError } =
    useForm<FormValues>({
      resolver: zodResolver(isEdit ? editSchema : baseSchema) as ...,
      defaultValues: { ... },
    });

  useEffect(() => {
    if (!data || !isEdit) return;
    reset({ ...data });
  }, [data, isEdit, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && featureId) {
        await updateFeature.mutateAsync({ id: featureId, payload: { ... } });
      } else {
        await createFeature.mutateAsync({ ... });
      }
      navigate("/admin/feature");
    } catch (err) {
      setError("root", { message: extractError(err) });
    }
  }

  if (isEdit && isLoading) return null;  // Page shows skeleton instead

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <SectionCard title="..." icon={<Icon />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="..." required error={errors.field?.message}>
            <Input {...register("field")} />
          </Field>
        </div>
      </SectionCard>

      {errors.root && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {errors.root.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 px-6 py-4 flex items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Feature"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate("/admin/feature")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

---

## 7. List Page Pattern

```tsx
function FeatureListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const params: Record<string, string> = { page: String(page), limit: "10" };
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading, isError } = useFeatures(params);

  function resetPage() { setPage(1); }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spaos-eucalyptus">Features</h1>
          <p className="text-sm text-stone-500 mt-1">Subtitle</p>
        </div>
        <Button onClick={() => navigate("/admin/features/new")}>
          <Plus className="w-4 h-4" /> New Feature
        </Button>
      </div>

      {/* Filters — always extracted to FeatureFilters component */}
      <FeatureFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); resetPage(); }}
        onClear={() => { setSearch(""); resetPage(); }}
      />

      {isError && <div className="...error banner...">Failed to load.</div>}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        onRowClick={(row) => navigate(`/admin/features/${row.id}/edit`)}
        emptyMessage="No features found."
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-400">{data?.meta.total} items</p>
        <TablePagination
          page={page}
          totalPages={data?.meta.totalPages ?? 1}
          total={data?.meta.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
```

---

## 8. Skeleton Pattern

Skeletons use `animate-pulse` and mirror the real layout. The page shows the skeleton, not the form component.

```tsx
export function FeatureFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* identity banner placeholder */}
      <div className="bg-white rounded-xl border border-stone-200 px-6 py-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-stone-100 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 bg-stone-100 rounded" />
          <div className="h-3 w-28 bg-stone-100 rounded" />
        </div>
      </div>
      {/* section card placeholders — match real section column counts */}
      {[2, 3, 2].map((cols, i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/60">
            <div className="h-4 w-32 bg-stone-100 rounded" />
          </div>
          <div className={`p-6 grid grid-cols-${cols} gap-4`}>
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="h-3 w-20 bg-stone-100 rounded" />
                <div className="h-9 bg-stone-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 9. Identity Banner Pattern

Shown above the edit form when `isEdit && data` is truthy. Read-only, never contains form fields.

```tsx
export function FeatureIdentityBanner({ feature }: { feature: Feature }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 px-6 py-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-spaos-eucalyptus/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-spaos-eucalyptus" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-800">{feature.name}</p>
        <p className="text-sm text-stone-500 mt-0.5">{/* key meta */}</p>
      </div>
      {/* optional status or lock badge */}
      <div className="flex items-center gap-1.5 text-xs text-stone-400 border border-stone-200 rounded-lg px-3 py-1.5">
        <Lock className="w-3 h-3" />
        <span>{feature.isActive ? "Active" : "Inactive"}</span>
      </div>
    </div>
  );
}
```

---

## 10. Colour & Design Tokens

colors: {
  brand: {
    primary:   "#1E40AF",   /* Deep blue — nav, headers, primary buttons */
    hover:     "#1E3A8A",   /* Darker on hover */
    light:     "#EFF6FF",   /* Light blue backgrounds, badges */
    accent:    "#F97316",   /* Orange — CTAs, "Book Now", countdown timer */
    accentHov: "#EA580C",   /* Orange hover */
  }
}
```

## 11. What NOT to Do

❌ Do not copy `Field`, `SectionCard`, or `extractError` into a page or feature file  
❌ Do not write form schema inside a page file  
❌ Do not put `useMutation` calls inside a page file  
❌ Do not write inline filter JSX inside a list page — always extract to `FeatureFilters.tsx`  
❌ Do not write custom modal/dialog/drawer HTML — install the shadcn component  
❌ Do not use `style={{}}` inline styles  
❌ Do not create a component file longer than ~250 lines — split it  
❌ Do not duplicate skeleton markup between the page and the form component — skeleton lives in its own file, page renders it  
