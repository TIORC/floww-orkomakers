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
      agenda_eventos: {
        Row: {
          convidados: Json
          created_at: string
          criado_por: string
          data_evento: string
          descricao: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          realizada: boolean
          titulo: string
          updated_at: string
        }
        Insert: {
          convidados?: Json
          created_at?: string
          criado_por: string
          data_evento: string
          descricao?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          realizada?: boolean
          titulo: string
          updated_at?: string
        }
        Update: {
          convidados?: Json
          created_at?: string
          criado_por?: string
          data_evento?: string
          descricao?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          realizada?: boolean
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      avisos: {
        Row: {
          criado_em: string
          decidido_em: string | null
          decidido_por_email: string | null
          decidido_por_nome: string
          gestor_email: string | null
          id: string
          motivo_recusa: string
          payload: Json
          setor: string
          solicitante_email: string
          solicitante_nome: string
          status: string
          tipo: string
        }
        Insert: {
          criado_em?: string
          decidido_em?: string | null
          decidido_por_email?: string | null
          decidido_por_nome?: string
          gestor_email?: string | null
          id?: string
          motivo_recusa?: string
          payload?: Json
          setor?: string
          solicitante_email: string
          solicitante_nome?: string
          status?: string
          tipo: string
        }
        Update: {
          criado_em?: string
          decidido_em?: string | null
          decidido_por_email?: string | null
          decidido_por_nome?: string
          gestor_email?: string | null
          id?: string
          motivo_recusa?: string
          payload?: Json
          setor?: string
          solicitante_email?: string
          solicitante_nome?: string
          status?: string
          tipo?: string
        }
        Relationships: []
      }
      banco_horas_dias: {
        Row: {
          atualizado_em: string
          data: string
          dia_semana: string
          espelho_id: string
          horas_compensar_min: number
          horas_extras_min: number
          horas_faltas_min: number
          id: string
          observacao: string
          trabalhado_min: number
          tratamento: string
        }
        Insert: {
          atualizado_em?: string
          data: string
          dia_semana?: string
          espelho_id: string
          horas_compensar_min?: number
          horas_extras_min?: number
          horas_faltas_min?: number
          id?: string
          observacao?: string
          trabalhado_min?: number
          tratamento?: string
        }
        Update: {
          atualizado_em?: string
          data?: string
          dia_semana?: string
          espelho_id?: string
          horas_compensar_min?: number
          horas_extras_min?: number
          horas_faltas_min?: number
          id?: string
          observacao?: string
          trabalhado_min?: number
          tratamento?: string
        }
        Relationships: [
          {
            foreignKeyName: "banco_horas_dias_espelho_id_fkey"
            columns: ["espelho_id"]
            isOneToOne: false
            referencedRelation: "banco_horas_espelhos"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_horas_espelhos: {
        Row: {
          atualizado_em: string
          colaborador_cargo: string
          colaborador_departamento: string
          colaborador_nome: string
          criado_em: string
          horas_compensar_min: number
          horas_extras_min: number
          horas_faltas_min: number
          horas_pagar_desc_min: number
          horas_trabalhadas_min: number
          id: string
          importado_por: string
          mes_referencia: string | null
          observacao: string
          periodo_fim: string
          periodo_inicio: string
          saldo_anterior_min: number | null
        }
        Insert: {
          atualizado_em?: string
          colaborador_cargo?: string
          colaborador_departamento?: string
          colaborador_nome: string
          criado_em?: string
          horas_compensar_min?: number
          horas_extras_min?: number
          horas_faltas_min?: number
          horas_pagar_desc_min?: number
          horas_trabalhadas_min?: number
          id?: string
          importado_por?: string
          mes_referencia?: string | null
          observacao?: string
          periodo_fim: string
          periodo_inicio: string
          saldo_anterior_min?: number | null
        }
        Update: {
          atualizado_em?: string
          colaborador_cargo?: string
          colaborador_departamento?: string
          colaborador_nome?: string
          criado_em?: string
          horas_compensar_min?: number
          horas_extras_min?: number
          horas_faltas_min?: number
          horas_pagar_desc_min?: number
          horas_trabalhadas_min?: number
          id?: string
          importado_por?: string
          mes_referencia?: string | null
          observacao?: string
          periodo_fim?: string
          periodo_inicio?: string
          saldo_anterior_min?: number | null
        }
        Relationships: []
      }
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
          desativacao_ate: string | null
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
          motivo_desligamento: string
          motivo_desligamento_outros: string
          nivel_acesso: string
          nome: string
          nome_completo: string
          observacao_desligamento: string
          origem_cadastro: string
          ouvidor: boolean
          papel: string
          participa_gamificacao: string
          sexo: string
          situacao: string
          sublider_area: string
          tipo_desligamento: string
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
          desativacao_ate?: string | null
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
          motivo_desligamento?: string
          motivo_desligamento_outros?: string
          nivel_acesso?: string
          nome: string
          nome_completo: string
          observacao_desligamento?: string
          origem_cadastro?: string
          ouvidor?: boolean
          papel?: string
          participa_gamificacao?: string
          sexo?: string
          situacao?: string
          sublider_area?: string
          tipo_desligamento?: string
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
          desativacao_ate?: string | null
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
          motivo_desligamento?: string
          motivo_desligamento_outros?: string
          nivel_acesso?: string
          nome?: string
          nome_completo?: string
          observacao_desligamento?: string
          origem_cadastro?: string
          ouvidor?: boolean
          papel?: string
          participa_gamificacao?: string
          sexo?: string
          situacao?: string
          sublider_area?: string
          tipo_desligamento?: string
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
      feriados_cadastrados: {
        Row: {
          abrangencia: string
          atualizado_em: string
          criado_em: string
          criado_por_email: string
          data: string
          id: string
          nome: string
          recorrente: boolean
          tipo: string
        }
        Insert: {
          abrangencia?: string
          atualizado_em?: string
          criado_em?: string
          criado_por_email?: string
          data: string
          id?: string
          nome: string
          recorrente?: boolean
          tipo: string
        }
        Update: {
          abrangencia?: string
          atualizado_em?: string
          criado_em?: string
          criado_por_email?: string
          data?: string
          id?: string
          nome?: string
          recorrente?: boolean
          tipo?: string
        }
        Relationships: []
      }
      ferias_programadas: {
        Row: {
          colaborador_email: string
          colaborador_nome: string
          criado_em: string
          fim: string
          id: string
          inicio: string
          programado_por_email: string
        }
        Insert: {
          colaborador_email: string
          colaborador_nome?: string
          criado_em?: string
          fim: string
          id?: string
          inicio: string
          programado_por_email: string
        }
        Update: {
          colaborador_email?: string
          colaborador_nome?: string
          criado_em?: string
          fim?: string
          id?: string
          inicio?: string
          programado_por_email?: string
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
      inventory_mobile_entries: {
        Row: {
          categoria_id: string | null
          created_at: string
          created_by: string
          data: string
          equipamento: string
          es_text: string | null
          id: string
          patrimonio: string | null
          status: string
          ti_name: string
          tipo: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string
          data?: string
          equipamento: string
          es_text?: string | null
          id?: string
          patrimonio?: string | null
          status?: string
          ti_name: string
          tipo: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string
          data?: string
          equipamento?: string
          es_text?: string | null
          id?: string
          patrimonio?: string | null
          status?: string
          ti_name?: string
          tipo?: string
        }
        Relationships: []
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
      ponto_batidas: {
        Row: {
          colaborador_email: string
          colaborador_nome: string
          criado_em: string
          id: string
          latitude: number
          longitude: number
          precisao: number | null
          registrado_em: string
        }
        Insert: {
          colaborador_email: string
          colaborador_nome?: string
          criado_em?: string
          id?: string
          latitude: number
          longitude: number
          precisao?: number | null
          registrado_em?: string
        }
        Update: {
          colaborador_email?: string
          colaborador_nome?: string
          criado_em?: string
          id?: string
          latitude?: number
          longitude?: number
          precisao?: number | null
          registrado_em?: string
        }
        Relationships: []
      }
      ponto_solicitacoes: {
        Row: {
          criado_em: string
          data: string
          entrada: string | null
          id: string
          motivo: string
          saida: string | null
          solicitante_email: string
          solicitante_nome: string
          status: string
          tipo: string
        }
        Insert: {
          criado_em?: string
          data: string
          entrada?: string | null
          id?: string
          motivo?: string
          saida?: string | null
          solicitante_email: string
          solicitante_nome?: string
          status?: string
          tipo: string
        }
        Update: {
          criado_em?: string
          data?: string
          entrada?: string | null
          id?: string
          motivo?: string
          saida?: string | null
          solicitante_email?: string
          solicitante_nome?: string
          status?: string
          tipo?: string
        }
        Relationships: []
      }
      reconhecimento_comentarios: {
        Row: {
          autor_email: string
          autor_nome: string
          criado_em: string
          id: string
          reconhecimento_id: string
          texto: string
        }
        Insert: {
          autor_email: string
          autor_nome?: string
          criado_em?: string
          id?: string
          reconhecimento_id: string
          texto: string
        }
        Update: {
          autor_email?: string
          autor_nome?: string
          criado_em?: string
          id?: string
          reconhecimento_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconhecimento_comentarios_reconhecimento_id_fkey"
            columns: ["reconhecimento_id"]
            isOneToOne: false
            referencedRelation: "reconhecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      reconhecimento_curtidas: {
        Row: {
          colaborador_email: string
          criado_em: string
          reconhecimento_id: string
        }
        Insert: {
          colaborador_email: string
          criado_em?: string
          reconhecimento_id: string
        }
        Update: {
          colaborador_email?: string
          criado_em?: string
          reconhecimento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconhecimento_curtidas_reconhecimento_id_fkey"
            columns: ["reconhecimento_id"]
            isOneToOne: false
            referencedRelation: "reconhecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      reconhecimento_mencoes: {
        Row: {
          foto_url: string | null
          id: string
          reconhecimento_id: string
          rotulo: string
          tipo: string
          valor: string
        }
        Insert: {
          foto_url?: string | null
          id?: string
          reconhecimento_id: string
          rotulo: string
          tipo: string
          valor: string
        }
        Update: {
          foto_url?: string | null
          id?: string
          reconhecimento_id?: string
          rotulo?: string
          tipo?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconhecimento_mencoes_reconhecimento_id_fkey"
            columns: ["reconhecimento_id"]
            isOneToOne: false
            referencedRelation: "reconhecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      reconhecimentos: {
        Row: {
          autor_email: string
          autor_foto: string | null
          autor_nome: string
          cargo_promovido: string | null
          criado_em: string
          id: string
          mensagem: string
          tipo: string
        }
        Insert: {
          autor_email: string
          autor_foto?: string | null
          autor_nome?: string
          cargo_promovido?: string | null
          criado_em?: string
          id?: string
          mensagem: string
          tipo?: string
        }
        Update: {
          autor_email?: string
          autor_foto?: string | null
          autor_nome?: string
          cargo_promovido?: string | null
          criado_em?: string
          id?: string
          mensagem?: string
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
      user_roles: {
        Row: {
          colaborador_id: string
          role: string
          user_id: string
        }
        Insert: {
          colaborador_id: string
          role: string
          user_id: string
        }
        Update: {
          colaborador_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores_importados"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas: {
        Row: {
          cargo_id: string
          criado_em: string
          criado_por: string | null
          detalhes: Json
          id: string
          setor: string
          status: string
          titulo: string
        }
        Insert: {
          cargo_id: string
          criado_em?: string
          criado_por?: string | null
          detalhes?: Json
          id?: string
          setor: string
          status?: string
          titulo: string
        }
        Update: {
          cargo_id?: string
          criado_em?: string
          criado_por?: string | null
          detalhes?: Json
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
      criar_agenda_evento: {
        Args: {
          convidados?: Json
          data_evento: string
          descricao?: string
          email_caller: string
          hora_fim?: string
          hora_inicio?: string
          titulo: string
        }
        Returns: {
          convidados: Json
          created_at: string
          criado_por: string
          data_evento: string
          descricao: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          realizada: boolean
          titulo: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "agenda_eventos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      eh_gestao_ou_administracao: { Args: never; Returns: boolean }
      eh_rh_ou_administracao: { Args: never; Returns: boolean }
      excluir_agenda_evento: {
        Args: { email_caller: string; evento_id: string }
        Returns: undefined
      }
      listar_agenda_eventos: {
        Args: { email_caller: string }
        Returns: {
          convidados: Json
          created_at: string
          criado_por: string
          data_evento: string
          descricao: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          realizada: boolean
          titulo: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "agenda_eventos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      marcar_agenda_evento_realizada: {
        Args: { email_caller: string; evento_id: string; marcar: boolean }
        Returns: undefined
      }
      normalizar_nome_banco: { Args: { nome: string }; Returns: string }
      pode_gerir_banco_de_horas: { Args: never; Returns: boolean }
      seguranca_administracao: { Args: never; Returns: boolean }
      seguranca_le_registro_pessoal: {
        Args: { email_alvo: string }
        Returns: boolean
      }
      seguranca_membro_interno: { Args: never; Returns: boolean }
      seguranca_pode_notificar: {
        Args: {
          destino: string
          foto_ator: string
          nome_ator: string
          texto_aviso: string
          tipo_aviso: string
        }
        Returns: boolean
      }
      seguranca_tem_papel: { Args: { papeis: string[] }; Returns: boolean }
      transferir_ouvidor: { Args: { destino_id: string }; Returns: undefined }
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
