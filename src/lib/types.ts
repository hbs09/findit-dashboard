// Types partilhados — refletem o schema da DB Supabase

export type Salon = {
  id: string;
  nome_salao: string;
  dono_id: string;
  morada: string | null;
  cidade: string | null;
  imagem: string | null;
  categoria: string | null;
  publico: string | null;
  hora_abertura: string | null;
  hora_fecho: string | null;
  intervalo_minutos: number | null;
  almoco_inicio: string | null;
  almoco_fim: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  avatar_url: string | null;
};

export type Service = {
  id: string;
  salon_id: string;
  nome: string;
  preco: number;
  duracao_minutos: number;
  category_id: string | null;
};

export type ServiceCategory = {
  id: string;
  nome: string;
};

export type AppointmentStatus = "pendente" | "confirmado" | "cancelado";

export type Appointment = {
  id: string;
  salon_id: string;
  cliente_id: string | null;
  service_id: string;
  salon_staff_id: string | null;
  data_hora: string;
  status: AppointmentStatus;
  cliente_nome: string | null;
  notas: string | null;
};

export type SalonStaff = {
  id: string;
  salon_id: string;
  user_id: string | null;
  email: string;
  status: "ativo" | "pendente" | "recusado";
  role: "gerente" | "staff";
  temp_name: string | null;
};

export type SalonClosure = {
  id: string;
  salon_id: string;
  start_date: string;
  end_date: string;
  motivo: string | null;
};

export type SalonPortfolioImage = {
  id: string;
  salon_id: string;
  image_url: string;
  description: string | null;
  position: number;
};
