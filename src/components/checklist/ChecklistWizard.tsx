import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Save } from "lucide-react";
import { StepPrep } from "./steps/StepPrep";
import { StepMonthly } from "./steps/StepMonthly";
import { StepWeekly } from "./steps/StepWeekly";
import { StepDaily } from "./steps/StepDaily";
import { StepH4 } from "./steps/StepH4";
import { StepH1 } from "./steps/StepH1";
import { StepEntryDecision } from "./steps/StepEntryDecision";
import { StepExecutionLog } from "./steps/StepExecutionLog";

export interface ChecklistData {
  // Step 1: Prep
  prep_workspace_clean: boolean | null;
  prep_aromatherapy: boolean | null;
  prep_best_trader: boolean | null;
  
  // Step 2: Monthly
  monthly_previous_month: string | null;
  monthly_fvg_count: number | null;
  monthly_current_price_location: string | null;
  
  // Step 3: Weekly
  weekly_previous_week: string | null;
  weekly_fvg_count: number | null;
  weekly_current_price_location: string | null;
  
  // Step 4: Daily
  daily_yesterday: string | null;
  daily_fvg_count: number | null;
  daily_current_price_location: string | null;
  
  // Step 5: 4H
  h4_context: string | null;
  h4_fvg_count: number | null;
  h4_price_location: string | null;
  
  // Step 6: 1H
  h1_context: string | null;
  h1_fvg_count: number | null;
  h1_poi_identified: boolean | null;
  
  // Step 7: Entry Decision
  entry_conditions_met: boolean | null;
  no_trade_reason: string | null;
  
  // Step 8: Execution Log
  executed_entry: boolean | null;
  entries: Array<{
    entry_number: number;
    entry_model: string;
    result: string | null;
  }>;
}

const STEPS = [
  { number: 1, name: "Prep", title: "Preparación" },
  { number: 2, name: "Monthly", title: "Mensual" },
  { number: 3, name: "Weekly", title: "Semanal" },
  { number: 4, name: "Daily", title: "Diario" },
  { number: 5, name: "4H", title: "4 Horas" },
  { number: 6, name: "1H", title: "1 Hora" },
  { number: 7, name: "Entry", title: "Decisión" },
  { number: 8, name: "Log", title: "Registro" },
];

const initialData: ChecklistData = {
  prep_workspace_clean: null,
  prep_aromatherapy: null,
  prep_best_trader: null,
  monthly_previous_month: null,
  monthly_fvg_count: null,
  monthly_current_price_location: null,
  weekly_previous_week: null,
  weekly_fvg_count: null,
  weekly_current_price_location: null,
  daily_yesterday: null,
  daily_fvg_count: null,
  daily_current_price_location: null,
  h4_context: null,
  h4_fvg_count: null,
  h4_price_location: null,
  h1_context: null,
  h1_fvg_count: null,
  h1_poi_identified: null,
  entry_conditions_met: null,
  no_trade_reason: null,
  executed_entry: null,
  entries: [],
};

export const ChecklistWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<ChecklistData>(initialData);
  const [existingChecklistId, setExistingChecklistId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTodayChecklist();
  }, []);

  const loadTodayChecklist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: checklist, error } = await supabase
      .from('daily_checklists')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayDate)
      .single();

    if (checklist && !error) {
      setExistingChecklistId(checklist.id);
      setData({
        prep_workspace_clean: checklist.prep_schedule_clear,
        prep_aromatherapy: checklist.prep_30min_available,
        prep_best_trader: null,
        monthly_previous_month: checklist.monthly_previous_month,
        monthly_fvg_count: checklist.monthly_fvg_count,
        monthly_current_price_location: checklist.monthly_current_price_location,
        weekly_previous_week: checklist.weekly_previous_week,
        weekly_fvg_count: checklist.weekly_fvg_count,
        weekly_current_price_location: checklist.weekly_current_price_location,
        daily_yesterday: checklist.daily_yesterday,
        daily_fvg_count: checklist.daily_fvg_count,
        daily_current_price_location: checklist.daily_current_price_location,
        h4_context: checklist.h4_context,
        h4_fvg_count: checklist.h4_fvg_count,
        h4_price_location: checklist.h4_price_location,
        h1_context: checklist.h1_context,
        h1_fvg_count: checklist.h1_fvg_count,
        h1_poi_identified: checklist.h1_poi_identified,
        entry_conditions_met: checklist.entry_conditions_met,
        no_trade_reason: checklist.no_trade_reason,
        executed_entry: checklist.executed_entry,
        entries: [],
      });

      // Load entries
      const { data: entries } = await supabase
        .from('checklist_entries')
        .select('*')
        .eq('checklist_id', checklist.id)
        .order('entry_number');

      if (entries) {
        setData(prev => ({
          ...prev,
          entries: entries.map(e => ({
            entry_number: e.entry_number,
            entry_model: e.entry_model,
            result: e.result,
          })),
        }));
      }
    }
  };

  const calculateCompletion = (): number => {
    let completed = 0;
    let total = 0;

    // Step 1
    total += 3;
    if (data.prep_workspace_clean) completed++;
    if (data.prep_aromatherapy) completed++;
    if (data.prep_best_trader) completed++;

    // Step 2
    total += 3;
    if (data.monthly_previous_month) completed++;
    if (data.monthly_fvg_count !== null) completed++;
    if (data.monthly_current_price_location) completed++;

    // Step 3
    total += 3;
    if (data.weekly_previous_week) completed++;
    if (data.weekly_fvg_count !== null) completed++;
    if (data.weekly_current_price_location) completed++;

    // Step 4
    total += 3;
    if (data.daily_yesterday) completed++;
    if (data.daily_fvg_count !== null) completed++;
    if (data.daily_current_price_location) completed++;

    // Step 5
    total += 3;
    if (data.h4_context) completed++;
    if (data.h4_fvg_count !== null) completed++;
    if (data.h4_price_location) completed++;

    // Step 6
    total += 3;
    if (data.h1_context) completed++;
    if (data.h1_fvg_count !== null) completed++;
    if (data.h1_poi_identified !== null) completed++;

    // Step 7
    total += 1;
    if (data.entry_conditions_met !== null) completed++;

    // Step 8 (only if entry conditions met)
    if (data.entry_conditions_met === true) {
      total += 1;
      if (data.executed_entry !== null) completed++;
    }

    return Math.round((completed / total) * 100);
  };

  const updateData = (updates: Partial<ChecklistData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const saveChecklist = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("No autenticado");
      setSaving(false);
      return;
    }

    const completionPercentage = calculateCompletion();
    const checklistPayload = {
      user_id: user.id,
      date: todayDate,
      completion_percentage: completionPercentage,
      prep_schedule_clear: data.prep_workspace_clean,
      prep_30min_available: data.prep_aromatherapy,
      monthly_previous_month: data.monthly_previous_month,
      monthly_fvg_count: data.monthly_fvg_count,
      monthly_current_price_location: data.monthly_current_price_location,
      weekly_previous_week: data.weekly_previous_week,
      weekly_fvg_count: data.weekly_fvg_count,
      weekly_current_price_location: data.weekly_current_price_location,
      daily_yesterday: data.daily_yesterday,
      daily_fvg_count: data.daily_fvg_count,
      daily_current_price_location: data.daily_current_price_location,
      h4_context: data.h4_context,
      h4_fvg_count: data.h4_fvg_count,
      h4_price_location: data.h4_price_location,
      h1_context: data.h1_context,
      h1_fvg_count: data.h1_fvg_count,
      h1_poi_identified: data.h1_poi_identified,
      entry_conditions_met: data.entry_conditions_met,
      no_trade_reason: data.no_trade_reason,
      executed_entry: data.executed_entry,
      is_completed: completionPercentage === 100,
    };

    let checklistId = existingChecklistId;

    if (existingChecklistId) {
      const { error } = await supabase
        .from('daily_checklists')
        .update(checklistPayload)
        .eq('id', existingChecklistId);

      if (error) {
        toast.error("Error al actualizar checklist");
        setSaving(false);
        return;
      }
    } else {
      const { data: newChecklist, error } = await supabase
        .from('daily_checklists')
        .insert(checklistPayload)
        .select()
        .single();

      if (error) {
        toast.error("Error al guardar checklist");
        setSaving(false);
        return;
      }
      checklistId = newChecklist.id;
      setExistingChecklistId(checklistId);
    }

    // Save entries
    if (checklistId && data.entries.length > 0) {
      // Delete existing entries first
      await supabase
        .from('checklist_entries')
        .delete()
        .eq('checklist_id', checklistId);

      // Insert new entries
      const entriesPayload = data.entries.map(entry => ({
        checklist_id: checklistId,
        entry_number: entry.entry_number,
        entry_model: entry.entry_model,
        result: entry.result,
      }));

      const { error: entriesError } = await supabase
        .from('checklist_entries')
        .insert(entriesPayload);

      if (entriesError) {
        toast.error("Error al guardar entradas");
        setSaving(false);
        return;
      }
    }

    toast.success(`Checklist guardado (${completionPercentage}%)`);
    setSaving(false);
  };

  const completion = calculateCompletion();

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return data.prep_workspace_clean && data.prep_aromatherapy && data.prep_best_trader;
      case 2:
        return !!data.monthly_previous_month && data.monthly_fvg_count !== null && !!data.monthly_current_price_location;
      case 3:
        return !!data.weekly_previous_week && data.weekly_fvg_count !== null && !!data.weekly_current_price_location;
      case 4:
        return !!data.daily_yesterday && data.daily_fvg_count !== null && !!data.daily_current_price_location;
      case 5:
        return !!data.h4_context && data.h4_fvg_count !== null && !!data.h4_price_location;
      case 6:
        return !!data.h1_context && data.h1_fvg_count !== null && data.h1_poi_identified !== null;
      case 7:
        return data.entry_conditions_met !== null;
      case 8:
        return data.executed_entry !== null;
      default:
        return true;
    }
  };

  const shouldSkipToEnd = (): boolean => {
    // Skip to end if no entry conditions met
    if (currentStep === 7 && data.entry_conditions_met === false) {
      return true;
    }
    return false;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepPrep data={data} updateData={updateData} />;
      case 2:
        return <StepMonthly data={data} updateData={updateData} />;
      case 3:
        return <StepWeekly data={data} updateData={updateData} />;
      case 4:
        return <StepDaily data={data} updateData={updateData} />;
      case 5:
        return <StepH4 data={data} updateData={updateData} />;
      case 6:
        return <StepH1 data={data} updateData={updateData} />;
      case 7:
        return <StepEntryDecision data={data} updateData={updateData} />;
      case 8:
        return <StepExecutionLog data={data} updateData={updateData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Progreso de Hoy</CardTitle>
            <span className="text-2xl font-bold text-primary">{completion}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completion} className="h-3" />
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => (
              <button
                key={step.number}
                onClick={() => setCurrentStep(step.number)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  currentStep === step.number
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === step.number
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  {step.number}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-primary">Paso {currentStep}:</span>
              {STEPS[currentStep - 1].title}
            </CardTitle>
            {shouldSkipToEnd() && (
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">No operar hoy</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <Button onClick={saveChecklist} disabled={saving} variant="secondary">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>

        {currentStep < 8 ? (
          <Button
            onClick={() => setCurrentStep(Math.min(8, currentStep + 1))}
            disabled={!canProceed()}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={saveChecklist}
            disabled={saving}
            className="bg-success hover:bg-success/90"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Finalizar
          </Button>
        )}
      </div>
    </div>
  );
};
