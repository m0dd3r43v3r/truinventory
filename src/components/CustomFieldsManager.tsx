import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2Icon, PlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface CustomField {
  id?: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  required: boolean;
  options: string[];
}

interface CustomFieldsManagerProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

export function CustomFieldsManager({ fields, onChange }: CustomFieldsManagerProps) {
  const [newOptionText, setNewOptionText] = useState<string>("");
  
  const addField = () => {
    onChange([
      ...fields,
      {
        name: "",
        type: "text",
        required: false,
        options: [],
      },
    ]);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    onChange(newFields);
  };

  const updateField = (index: number, updates: Partial<CustomField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const addOption = (fieldIndex: number) => {
    if (!newOptionText.trim()) return;
    
    const newFields = [...fields];
    newFields[fieldIndex].options = [...newFields[fieldIndex].options, newOptionText.trim()];
    onChange(newFields);
    setNewOptionText("");
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...fields];
    newFields[fieldIndex].options.splice(optionIndex, 1);
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Custom Fields</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      {fields.map((field, fieldIndex) => (
        <div key={fieldIndex} className="rounded-lg border p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Name</Label>
                  <Input
                    value={field.name}
                    onChange={(e) =>
                      updateField(fieldIndex, { name: e.target.value })
                    }
                    placeholder="Enter field name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value: CustomField["type"]) =>
                      updateField(fieldIndex, { type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`required-${fieldIndex}`}
                  checked={field.required}
                  onCheckedChange={(checked) =>
                    updateField(fieldIndex, { required: checked })
                  }
                />
                <Label htmlFor={`required-${fieldIndex}`}>Required field</Label>
              </div>

              {field.type === "select" && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {field.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <Input value={option} readOnly />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(fieldIndex, optionIndex)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newOptionText}
                        onChange={(e) => setNewOptionText(e.target.value)}
                        placeholder="Add new option"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOption(fieldIndex);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addOption(fieldIndex)}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => removeField(fieldIndex)}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 