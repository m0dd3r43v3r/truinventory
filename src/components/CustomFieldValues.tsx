import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  required: boolean;
  options: string[];
}

interface CustomFieldValuesProps {
  fields: CustomField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  disabled?: boolean;
}

export function CustomFieldValues({
  fields,
  values,
  onChange,
  disabled = false,
}: CustomFieldValuesProps) {
  const handleChange = (fieldId: string, value: any) => {
    onChange({
      ...values,
      [fieldId]: value,
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label>
            {field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.type === "text" && (
            <Input
              value={values[field.id] || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              disabled={disabled}
            />
          )}

          {field.type === "number" && (
            <Input
              type="number"
              value={values[field.id] || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              disabled={disabled}
            />
          )}

          {field.type === "date" && (
            <Input
              type="date"
              value={values[field.id] || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              disabled={disabled}
            />
          )}

          {field.type === "boolean" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`field-${field.id}`}
                checked={values[field.id] || false}
                onCheckedChange={(checked) => handleChange(field.id, checked)}
                disabled={disabled}
              />
              <Label htmlFor={`field-${field.id}`}>Yes</Label>
            </div>
          )}

          {field.type === "select" && (
            <Select
              value={values[field.id] || ""}
              onValueChange={(value) => handleChange(field.id, value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
} 