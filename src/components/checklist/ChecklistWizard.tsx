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
  monthly_highs_marked: boolean | null;
  monthly_lows_marked: boolean | null;
  
  // Step 3: Weekly
  weekly_news_reviewed: boolean | null;
  weekly_highs_marked: boolean | null;
  weekly_lows_marked: boolean | null;
  
  // Step 4: Daily
  daily_news_reviewed: boolean | null;
  daily_highs_marked: boolean | null;
  daily_lows_marked: boolean | null;
  daily_zones_marked: boolean | null;
  
  // Step 5: 4H
  h4_confluences_verified: boolean | null;
  h4_zones_marked: boolean | null;
  
  // Step 6: 1H
  h1_confluences_verified: boolean | null;
  h1_zones_identified: boolean | null;
  h1_direction_determined: boolean | null;
  
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
  no_entry_reasons: string[];
  no_entry_notes: string;
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
  monthly_highs_marked: null,
  monthly_lows_marked: null,
  weekly_news_reviewed: null,
  weekly_highs_marked: null,
  weekly_lows_marked: null,
  daily_news_reviewed: null,
  daily_highs_marked: null,
  daily_lows_marked: null,
  daily_zones_marked: null,
  h4_confluences_verified: null,
  h4_zones_marked: null,
  h1_confluences_verified: null,
  h1_zones_identified: null,
  h1_direction_determined: null,
  entry_conditions_met: null,
  no_trade_reason: null,
  executed_entry: null,
  entries: [],
  no_entry_reasons: [],
  no_entry_notes: "",
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
        monthly_highs_marked: null,
        monthly_lows_marked: null,
        weekly_news_reviewed: null,
        weekly_highs_marked: null,
        weekly_lows_marked: null,
        daily_news_reviewed: null,
        daily_highs_marked: null,
        daily_lows_marked: null,
        daily_zones_marked: null,
        h4_confluences_verified: null,
        h4_zones_marked: null,
        h1_confluences_verified: null,
        h1_zones_identified: null,
        h1_direction_determined: null,
        entry_conditions_met: checklist.entry_conditions_met,
        no_trade_reason: checklist.no_trade_reason,
        executed_entry: checklist.executed_entry,
        entries: [],
        no_entry_reasons: [],
        no_entry_notes: "",
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
    total += 2;
    if (data.monthly_highs_marked) completed++;
    if (data.monthly_lows_marked) completed++;

    // Step 3
    total += 3;
    if (data.weekly_news_reviewed) completed++;
    if (data.weekly_highs_marked) completed++;
    if (data.weekly_lows_marked) completed++;

    // Step 4
    total += 4;
    if (data.daily_news_reviewed) completed++;
    if (data.daily_highs_marked) completed++;
    if (data.daily_lows_marked) completed++;
    if (data.daily_zones_marked) completed++;

    // Step 5
    total += 2;
    if (data.h4_confluences_verified) completed++;
    if (data.h4_zones_marked) completed++;

    // Step 6
    total += 3;
    if (data.h1_confluences_verified) completed++;
    if (data.h1_zones_identified) completed++;
    if (data.h1_direction_determined) completed++;

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
        return data.monthly_highs_marked && data.monthly_lows_marked;
      case 3:
        return data.weekly_news_reviewed && data.weekly_highs_marked && data.weekly_lows_marked;
      case 4:
        return data.daily_news_reviewed && data.daily_highs_marked && data.daily_lows_marked && data.daily_zones_marked;
      case 5:
        return data.h4_confluences_verified && data.h4_zones_marked;
      case 6:
        return data.h1_confluences_verified && data.h1_zones_identified && data.h1_direction_determined;
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
