import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  name: string;
  broker: string;
  account_type: string;
  funding_company: string | null;
  initial_balance: number;
  risk_percentage: number;
  is_active: boolean;
}

export function AccountManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    broker: "",
    account_type: "Real",
    funding_company: "",
    initial_balance: "",
    risk_percentage: "1",
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAccounts(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const accountData = {
      name: formData.name,
      broker: formData.broker,
      account_type: formData.account_type,
      funding_company: formData.funding_company || null,
      initial_balance: parseFloat(formData.initial_balance),
      risk_percentage: parseFloat(formData.risk_percentage),
      user_id: user.id,
    };

    if (editingId) {
      const { error } = await supabase
        .from("accounts")
        .update(accountData)
        .eq("id", editingId);

      if (!error) {
        toast({ title: "Cuenta actualizada correctamente" });
        setOpen(false);
        resetForm();
        loadAccounts();
      }
    } else {
      const { error } = await supabase
        .from("accounts")
        .insert([accountData]);

      if (!error) {
        toast({ title: "Cuenta creada correctamente" });
        setOpen(false);
        resetForm();
        loadAccounts();
      }
    }
  };

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setFormData({
      name: account.name,
      broker: account.broker,
      account_type: account.account_type,
      funding_company: account.funding_company || "",
      initial_balance: account.initial_balance.toString(),
      risk_percentage: account.risk_percentage.toString(),
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Cuenta eliminada" });
      loadAccounts();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      broker: "",
      account_type: "Real",
      funding_company: "",
      initial_balance: "",
      risk_percentage: "1",
    });
    setEditingId(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cuentas de Trading</CardTitle>
          <CardDescription>Gestiona tus cuentas de diferentes brokers</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Cuenta" : "Nueva Cuenta"}</DialogTitle>
              <DialogDescription>
                Configura los detalles de tu cuenta de trading
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Cuenta</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mi Cuenta Principal"
                  required
                />
              </div>
              <div>
                <Label htmlFor="broker">Broker</Label>
                <Input
                  id="broker"
                  value={formData.broker}
                  onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                  placeholder="NinjaTrader, Interactive Brokers, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="account_type">Tipo de Cuenta</Label>
                <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Real">Real</SelectItem>
                    <SelectItem value="Fondeo">Fondeo</SelectItem>
                    <SelectItem value="Demo">Demo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.account_type === "Fondeo" && (
                <div>
                  <Label htmlFor="funding_company">Empresa de Fondeo</Label>
                  <Select value={formData.funding_company} onValueChange={(value) => setFormData({ ...formData, funding_company: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apex">Apex</SelectItem>
                      <SelectItem value="FTMO">FTMO</SelectItem>
                      <SelectItem value="Earn2Trade">Earn2Trade</SelectItem>
                      <SelectItem value="Funding Pips">Funding Pips</SelectItem>
                      <SelectItem value="The5ers">The 5%ers</SelectItem>
                      <SelectItem value="Otra">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="initial_balance">Balance Inicial ($)</Label>
                <Input
                  id="initial_balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                  placeholder="10000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="risk_percentage">Riesgo por Operación (%)</Label>
                <Input
                  id="risk_percentage"
                  type="number"
                  step="0.1"
                  value={formData.risk_percentage}
                  onChange={(e) => setFormData({ ...formData, risk_percentage: e.target.value })}
                  placeholder="1"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Actualizar" : "Crear"} Cuenta
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No tienes cuentas registradas. Crea una para comenzar.
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{account.name}</h4>
                    <Badge variant={account.account_type === "Real" ? "default" : account.account_type === "Fondeo" ? "secondary" : "outline"}>
                      {account.account_type}
                    </Badge>
                    {account.funding_company && (
                      <Badge variant="outline">{account.funding_company}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {account.broker} · Balance: ${account.initial_balance.toFixed(2)} · Riesgo: {account.risk_percentage}%
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(account)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
