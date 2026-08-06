"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function CerrarSesionButton({
  variant = "outline",
  className,
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function cerrarSesion() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant={variant} className={className} onClick={cerrarSesion} disabled={loading}>
      <LogOut className="size-4" />
      Cerrar sesión
    </Button>
  );
}
