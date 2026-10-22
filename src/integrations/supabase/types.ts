export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cargo_senioridades: {
        Row: {
          cargo_id: string
          criado_em: string
          faixa_maxima: number
          faixa_minima: number
          id: string
          nivel: string
          ordem: number
          salario_base: number
        }
        Insert: {
          cargo_id: string
          criado_em?: string
          faixa_maxima: number
          faixa_minima: number
          id?: string
          nivel: string
          ordem?: number
          salario_base: number
        }
        Update: {
          cargo_id?: string
          criado_em?: string
          faixa_maxima?: number
          faixa_minima?: number
          id?: string
          nivel?: string
          ordem?: number
          salario_base?: number
        }
        Relationships: [
          {
            foreignKeyName: "cargo_senioridades_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          atualizado_em: string
          cbo: string
          criado_em: string
          id: string
          nome: string
          setor: string
        }
        Insert: {
          atualizado_em?: string
          cbo?: string
          criado_em?: string
          id?: string
          nome: string
          setor: string
        }
        Update: {
          atualizado_em?: string
          cbo?: string
          criado_em?: string
          id?: string
          nome?: string
          setor?: string
        }
        Relationships: []
      }
      checkin_sentimento: {
        Row: {
          atualizado_em: string
          colaborador_email: string
          criado_em: string
          data: string
          emocao: string
          id: string
          motivo: string
        }
        Insert: {
          atualizado_em?: string
          colaborador_email: string
          criado_em?: string
          data?: string
          emocao: string
          id?: string
          motivo?: string
        }
        Update: {
          atualizado_em?: string
          colaborador_email?: string
          criado_em?: string
          data?: string
          emocao?: string
          id?: string
          motivo?: string
        }
        Relationships: []
      }
      colaboradores_importados: {
        Row: {
          acesso_master: boolean
          atualizado_em: string
          biografia: string
          cargo: string
          cargo_visivel: string
          cpf: string
          criado_em: string
          data_admissao: string
          data_cadastro: string
          data_nascimento: string
          departamento: string
          desligamento: string
          email: string
          etnia: string
          foto_url: string | null
          genero: string
          gestor_direto: string
          gestor_direto_email: string
          grupos: string
          id: string
          id_planilha: string
          idioma: string
          matricula: string
          nome: string
          nome_completo: string
          origem_cadastro: string
          papel: string
          participa_gamificacao: string
          sexo: string
          situacao: string
          ultimo_acesso: string
          ultimo_dia_trabalhado: string
          unidade: string
        }
        Insert: {
          acesso_master?: boolean
          atualizado_em?: string
          biografia?: string
          cargo?: string
          cargo_visivel?: string
          cpf?: string
          criado_em?: string
          data_admissao?: string
          data_cadastro?: string
          data_nascimento?: string
          departamento?: string
          desligamento?: string
          email: string
          etnia?: string
          foto_url?: string | null
          genero?: string
          gestor_direto?: string
          gestor_direto_email?: string
          grupos?: string
          id?: string
          id_planilha: string
          idioma?: string
          matricula?: string
          nome: string
          nome_completo: string
          origem_cadastro?: string
          papel?: string
          participa_gamificacao?: string
          sexo?: string
          situacao?: string
          ultimo_acesso?: string
          ultimo_dia_trabalhado?: string
          unidade?: string
        }
        Update: {
          acesso_master?: boolean
          atualizado_em?: string
          biografia?: string
          cargo?: string
          cargo_visivel?: string
          cpf?: string
          criado_em?: string
          data_admissao?: string
          data_cadastro?: string
          data_nascimento?: string
          departamento?: string
          desligamento?: string
          email?: string
          etnia?: string
          foto_url?: string | null
          genero?: string
          gestor_direto?: string
          gestor_direto_email?: string
          grupos?: string
          id?: string
          id_planilha?: string
          idioma?: string
          matricula?: string
          nome?: string
          nome_completo?: string
          origem_cadastro?: string
          papel?: string
          participa_gamificacao?: string
          sexo?: string
          situacao?: string
          ultimo_acesso?: string
          ultimo_dia_trabalhado?: string
          unidade?: string
        }
        Relationships: []
      }
      comunicados: {
        Row: {
          autor_id: string
          destaque: boolean
          id: string
          mensagem: string
          publicado_em: string
          publico_tipo: string
          publico_valores: string[]
          titulo: string
        }
        Insert: {
          autor_id?: string
          destaque?: boolean
          id?: string
          mensagem: string
          publicado_em?: string
          publico_tipo?: string
          publico_valores?: string[]
          titulo: string
        }
        Update: {
          autor_id?: string
          destaque?: boolean
          id?: string
          mensagem?: string
          publicado_em?: string
          publico_tipo?: string
          publico_valores?: string[]
          titulo?: string
        }
        Relationships: []
      }
      email_envios: {
        Row: {
          assunto: string | null
          criado_em: string
          destinatario: string | null
          detalhe: string | null
          evento: string
          id: string
          referencia: string
          status: string
        }
        Insert: {
          assunto?: string | null
          criado_em?: string
          destinatario?: string | null
          detalhe?: string | null
          evento: string
          id?: string
          referencia: string
          status: string
        }
        Update: {
          assunto?: string | null
          criado_em?: string
          destinatario?: string | null
          detalhe?: string | null
          evento?: string
          id?: string
          referencia?: string
          status?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          autor_email: string
          autor_id: string
          criado_em: string
          destinatario_email: string
          id: string
          mensagem: string
        }
        Insert: {
          autor_email: string
          autor_id?: string
          criado_em?: string
          destinatario_email: string
          id?: string
          mensagem: string
        }
        Update: {
          autor_email?: string
          autor_id?: string
          criado_em?: string
          destinatario_email?: string
          id?: string
          mensagem?: string
        }
        Relationships: []
      }
      historico_ranking_mensal: {
        Row: {
          ano: number
          colaborador_id: string | null
          criado_em: string
          foto_url: string | null
          id: string
          mes: number
          meta: number
          nome: string
          pontos: number
          posicao: number
          setor: string
        }
        Insert: {
          ano: number
          colaborador_id?: string | null
          criado_em?: string
          foto_url?: string | null
          id?: string
          mes: number
          meta?: number
          nome: string
          pontos?: number
          posicao: number
          setor?: string
        }
        Update: {
          ano?: number
          colaborador_id?: string | null
          criado_em?: string
          foto_url?: string | null
          id?: string
          mes?: number
          meta?: number
          nome?: string
          pontos?: number
          posicao?: number
          setor?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_ranking_mensal_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores_importados"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          ator_foto_url: string | null
          ator_nome: string
          criada_em: string
          destinatario_email: string
          id: string
          lida: boolean
          texto: string
          tipo: string
        }
        Insert: {
          ator_foto_url?: string | null
          ator_nome?: string
          criada_em?: string
          destinatario_email: string
          id?: string
          lida?: boolean
          texto: string
          tipo?: string
        }
        Update: {
          ator_foto_url?: string | null
          ator_nome?: string
          criada_em?: string
          destinatario_email?: string
          id?: string
          lida?: boolean
          texto?: string
          tipo?: string
        }
        Relationships: []
      }
      respostas_pesquisa: {
        Row: {
          colaborador_email: string
          id: string
          pesquisa: string
          respondido_em: string
          resposta: Json
        }
        Insert: {
          colaborador_email: string
          id?: string
          pesquisa: string
          respondido_em?: string
          resposta?: Json
        }
        Update: {
          colaborador_email?: string
          id?: string
          pesquisa?: string
          respondido_em?: string
          resposta?: Json
        }
        Relationships: []
      }
      setores: {
        Row: {
          criado_em: string
          id: string
          nome: string
          sigla: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          sigla: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          sigla?: string
        }
        Relationships: []
      }
      vagas: {
        Row: {
          cargo_id: string
          criado_em: string
          criado_por: string | null
          id: string
          setor: string
          status: string
          titulo: string
        }
        Insert: {
          cargo_id: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          setor: string
          status?: string
          titulo: string
        }
        Update: {
          cargo_id?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          setor?: string
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "vagas_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
