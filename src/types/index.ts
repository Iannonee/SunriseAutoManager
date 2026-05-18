export type UserRole =
  | 'Direttrice'
  | 'Vice Direttore'
  | 'Responsabile Vendite'
  | 'Venditore Senior'
  | 'Venditore'
  | 'Stagista';

export interface Profile {
  id: string;
  nome: string;
  cognome: string;
  role: string;
  discord_username: string | null;
  is_active: boolean;
  created_at: string;
}

export type VeicoloStato = 'Da completare' | 'Disponibile' | 'In Trattativa' | 'Venduto';

export interface Veicolo {
  id: string;
  modello: string;
  colore: string;
  condizioni: number;
  prezzo_acquisto: number;
  prezzo_vendita: number | null;
  trattabile: boolean;
  modifiche: string | null;
  foto_url: string | null;
  stato: VeicoloStato;
  note: string | null;
  created_by: string | null;
  created_at: string;
  profile?: Profile;
}

export interface AutoAcquistata {
  id: string;
  modello: string;
  colore: string;
  prezzo_acquisto: number;
  venduto_da: string;
  dipendente_id: string | null;
  data: string;
  created_by: string | null;
  created_at: string;
  dipendente?: Profile;
  creator?: Profile;
}

export interface VeicoloVenduto {
  id: string;
  veicolo_id: string | null;
  prezzo_vendita_finale: number;
  acquirente: string;
  dipendente_id: string | null;
  data: string;
  created_by: string | null;
  created_at: string;
  veicolo?: Veicolo;
  dipendente?: Profile;
  creator?: Profile;
}

export interface Turno {
  id: string;
  dipendente_id: string | null;
  data: string;
  ora_inizio: string;
  ora_fine: string;
  ore_totali: number;
  created_by: string | null;
  created_at: string;
  dipendente?: Profile;
}

export interface Comunicazione {
  id: string;
  testo: string;
  autore_id: string | null;
  created_at: string;
  autore?: Profile;
}

export interface BlacklistCliente {
  id: string;
  nome_cliente: string;
  data: string;
  motivo: string;
  aggiunto_da_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  aggiunto_da?: Profile;
}

export interface BilancioRecord {
  id: string;
  data: string;
  compilato_da_id: string | null;
  veicoli_acquistati: number;
  totale_speso: number;
  veicoli_venduti: number;
  totale_incassato: number;
  saldo_giornaliero: number;
  note: string | null;
  created_at: string;
  compilato_da?: Profile;
}

export type ComunicazioneStaffTipo =
  | 'Promozione'
  | 'Retrocessione'
  | 'Richiamo Verbale'
  | 'Richiamo Ufficiale'
  | 'Retrocessione Disciplinare'
  | 'Espulsione';

export interface ComunicazioneStaff {
  id: string;
  tipo: ComunicazioneStaffTipo;
  dipendente_id: string | null;
  da_ruolo: string | null;
  a_ruolo: string | null;
  data: string;
  motivazione: string;
  created_by: string | null;
  created_at: string;
  dipendente?: Profile;
  creator?: Profile;
}

export interface ChatAdminMessage {
  id: string;
  mittente_id: string | null;
  messaggio: string;
  created_at: string;
  mittente?: Profile;
}

export const ROLES: UserRole[] = [
  'Direttrice',
  'Vice Direttore',
  'Responsabile Vendite',
  'Venditore Senior',
  'Venditore',
  'Stagista',
];

export const ADMIN_ROLES: UserRole[] = ['Direttrice', 'Vice Direttore'];

export function isAdmin(role: string | null | undefined): boolean {
  return role === 'Direttrice' || role === 'Vice Direttore';
}

export function hasRole(role: string | null | undefined): role is UserRole {
  return ROLES.includes(role as UserRole);
}

export function hasVehicleAccess(_role: string | null | undefined): boolean {
  return true; // All roles
}

export function hasAdminSectionAccess(role: string | null | undefined): boolean {
  return isAdmin(role);
}

export function canManageBlacklist(role: string | null | undefined): boolean {
  return role === 'Direttrice' || role === 'Vice Direttore' || role === 'Responsabile Vendite';
}

export function canEditBlacklist(role: string | null | undefined): boolean {
  return isAdmin(role);
}

export function canEditAutoAcquistate(role: string | null | undefined): boolean {
  return isAdmin(role);
}

export function canEditVeicoliVenduti(role: string | null | undefined): boolean {
  return isAdmin(role);
}

export function canDeleteComunicazioni(role: string | null | undefined, autoreId: string | null, userId: string | null): boolean {
  if (isAdmin(role)) return true;
  return autoreId === userId;
}

export function canWriteComunicazioniStaff(role: string | null | undefined): boolean {
  return isAdmin(role);
}

export function fullName(profile: Profile | null | undefined): string {
  if (!profile) return 'Sconosciuto';
  return `${profile.nome} ${profile.cognome}`.trim();
}
