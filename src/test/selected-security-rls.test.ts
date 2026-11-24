// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const accounts = {
  admin: { id: "00000000-0000-0000-0000-000000000001", email: "security-admin@orcoma.com.br", role: "administrador" },
  member: { id: "00000000-0000-0000-0000-000000000002", email: "security-member@orcoma.com.br", role: "colaborador" },
  other: { id: "00000000-0000-0000-0000-000000000003", email: "security-other@orcoma.com.br", role: "colaborador" },
  manager: { id: "00000000-0000-0000-0000-000000000004", email: "security-manager@orcoma.com.br", role: "gestor" },
  guest: { id: "00000000-0000-0000-0000-000000000005", email: "security-guest@orcoma.com.br", role: "convidado" },
  outsider: { id: "00000000-0000-0000-0000-000000000006", email: "security-outsider@orcoma.com.br", role: "administrador" },
  dismissed: { id: "00000000-0000-0000-0000-000000000007", email: "security-dismissed@orcoma.com.br", role: "administrador" },
  leave: { id: "00000000-0000-0000-0000-000000000008", email: "security-leave@orcoma.com.br", role: "colaborador" },
} as const;

type Viewer = keyof typeof accounts;
const fixtureId = "10000000-0000-0000-0000-000000000001";
const insertedId = "10000000-0000-0000-0000-000000000002";
let db: PGlite;

async function asViewer<T>(viewer: Viewer, run: (tx: Transaction) => Promise<T>) {
  return db.transaction(async (tx) => {
    const account = accounts[viewer];
    await tx.exec("SET LOCAL ROLE authenticated");
    await tx.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: account.id, email: account.email })]);
    return run(tx);
  });
}

async function count(tx: Transaction, table: string) {
  const result = await tx.query<{ total: number }>(`SELECT count(*)::int AS total FROM public.${table}`);
  return result.rows[0]?.total ?? -1;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(new URL("./fixtures/selected-security-schema.sql", import.meta.url), "utf8"));
  // Seed two accounts before applying the exact production migration, exercising its backfill.
  for (const viewer of ["admin", "member"] as const) {
    const account = accounts[viewer];
    await db.query("INSERT INTO auth.users (id,email) VALUES ($1,$2)", [account.id, account.email]);
    await db.query("INSERT INTO public.colaboradores_importados (id,id_planilha,nome,nome_completo,email,nivel_acesso,situacao) VALUES ($1,$2,$2,$2,$3,$4,'Ativo')", [account.id, viewer, account.email, account.role]);
  }
  await db.exec(readFileSync(new URL("../../drizzle/migrations/0001_restrict_selected_permissive_access.sql", import.meta.url), "utf8"));
  for (const viewer of ["other", "manager", "guest", "outsider", "dismissed", "leave"] as const) {
    const account = accounts[viewer];
    // Self-chosen signup metadata must never confer privileges.
    await db.query("INSERT INTO auth.users (id,email,raw_user_meta_data) VALUES ($1,$2,'{\"role\":\"administrador\",\"acesso_master\":true}')", [account.id, account.email]);
    if (viewer === "outsider") continue;
    await db.query("INSERT INTO public.colaboradores_importados (id,id_planilha,nome,nome_completo,email,nivel_acesso,situacao) VALUES ($1,$2,$2,$2,$3,$4,$5)", [account.id, viewer, account.email, account.role, viewer === "dismissed" ? "Desligado" : viewer === "leave" ? "Desativado" : "Ativo"]);
  }
  await db.query("UPDATE public.colaboradores_importados SET gestor_direto_email=$1 WHERE id=$2", [accounts.manager.email, accounts.member.id]);
  await db.exec(`
    INSERT INTO public.cargos (id,nome,setor) VALUES ('${fixtureId}','Analista','TI');
    INSERT INTO public.cargo_senioridades (id,cargo_id,nivel,faixa_minima,salario_base,faixa_maxima) VALUES ('${fixtureId}','${fixtureId}','Junior',1000,1500,2000);
    INSERT INTO public.setores (id,nome,sigla) VALUES ('${fixtureId}','TI','TI');
    INSERT INTO public.vagas (id,cargo_id,setor,titulo) VALUES ('${fixtureId}','${fixtureId}','TI','Analista');
    INSERT INTO public.reconhecimentos (id,autor_email,mensagem) VALUES ('${fixtureId}','${accounts.member.email}','Reconhecimento de teste');
    INSERT INTO public.reconhecimento_mencoes (id,reconhecimento_id,tipo,valor,rotulo) VALUES ('${fixtureId}','${fixtureId}','todos','todos','Todos');
    INSERT INTO public.reconhecimento_curtidas (reconhecimento_id,colaborador_email) VALUES ('${fixtureId}','${accounts.member.email}');
    INSERT INTO public.reconhecimento_comentarios (id,reconhecimento_id,autor_email,texto) VALUES ('${fixtureId}','${fixtureId}','${accounts.member.email}','Comentário de teste');
    INSERT INTO public.historico_ranking_mensal (id,ano,mes,posicao,nome) VALUES ('${fixtureId}',2026,10,1,'member');
    INSERT INTO public.checkin_sentimento (id,colaborador_email,emocao) VALUES ('${fixtureId}','${accounts.member.email}','triste');
    INSERT INTO public.respostas_pesquisa (id,pesquisa,colaborador_email) VALUES ('${fixtureId}','Teste','${accounts.member.email}');
    INSERT INTO public.ferias_programadas (id,colaborador_email,inicio,fim,programado_por_email) VALUES ('${fixtureId}','${accounts.member.email}','2026-12-01','2026-12-10','${accounts.manager.email}');
    INSERT INTO public.inventory_mobile_entries (id,created_by,ti_name,equipamento,tipo) VALUES ('${fixtureId}','${accounts.member.id}','TI','Notebook','entrada');
    INSERT INTO public.feriados_cadastrados (id,nome,data,tipo) VALUES ('${fixtureId}','Natal','2026-12-25','nacional');
    INSERT INTO public.avisos (tipo,solicitante_email,status,decidido_por_email,decidido_por_nome,decidido_em) VALUES ('hora_extra','${accounts.member.email}','aprovado','${accounts.manager.email}','manager',now());
    INSERT INTO public.comunicados (autor_id,titulo,mensagem) VALUES ('${accounts.admin.id}','Untouched policy','Outside selected scope');
  `);
}, 30000);

afterAll(async () => { await db?.close(); });

describe("the sixteen selected permissive access findings", () => {
  for (const table of ["cargos", "cargo_senioridades", "setores", "colaboradores_importados"] as const) {
    it(`${table}: blocks unregistered access and reserves mutations for administrators`, async () => {
      expect(await asViewer("outsider", (tx) => count(tx, table))).toBe(0);
      expect(await asViewer("admin", (tx) => count(tx, table))).toBeGreaterThan(0);
      const adminOnlyRead = table === "cargos" || table === "cargo_senioridades";
      expect(await asViewer("member", (tx) => count(tx, table))).toBe(adminOnlyRead ? 0 : table === "setores" ? 1 : 7);
      const field = table === "cargo_senioridades" ? "nivel" : "nome";
      const id = table === "colaboradores_importados" ? accounts.member.id : fixtureId;
      await asViewer("member", async (tx) => {
        expect((await tx.query(`UPDATE public.${table} SET ${field}='unauthorized' WHERE id=$1 RETURNING id`, [id])).rows).toHaveLength(0);
        expect((await tx.query(`DELETE FROM public.${table} WHERE id=$1 RETURNING id`, [id])).rows).toHaveLength(0);
      });
      await asViewer("admin", async (tx) => {
        expect((await tx.query(`UPDATE public.${table} SET ${field}=${field} WHERE id=$1 RETURNING id`, [id])).rows).toHaveLength(1);
      });
      // Existing employee accounts cannot self-promote, even by editing their own row.
      if (table === "colaboradores_importados") {
        await asViewer("member", async (tx) => {
          expect((await tx.query("UPDATE public.colaboradores_importados SET nivel_acesso='administrador',acesso_master=true WHERE id=$1 RETURNING id", [accounts.member.id])).rows).toHaveLength(0);
        });
        await expect(asViewer("member", (tx) => tx.query("UPDATE public.user_roles SET role='administrador' WHERE user_id=$1", [accounts.member.id]))).rejects.toThrow(/permission denied/);
        await expect(asViewer("outsider", (tx) => tx.query("INSERT INTO public.colaboradores_importados (id_planilha,nome,nome_completo,email,nivel_acesso,situacao) VALUES ('fake','fake','fake',$1,'administrador','Ativo')", [accounts.outsider.email]))).rejects.toThrow(/row-level security/);
      } else {
        const insert = table === "cargos"
          ? `INSERT INTO public.cargos (id,nome,setor) VALUES ('${insertedId}','Novo','TI')`
          : table === "setores"
            ? `INSERT INTO public.setores (id,nome,sigla) VALUES ('${insertedId}','Novo','N')`
            : `INSERT INTO public.cargo_senioridades (id,cargo_id,nivel,faixa_minima,salario_base,faixa_maxima) VALUES ('${insertedId}','${fixtureId}','Senior',2000,2500,3000)`;
        await expect(asViewer("member", (tx) => tx.exec(insert))).rejects.toThrow(/row-level security/);
        await asViewer("admin", async (tx) => {
          await tx.exec(insert);
          expect((await tx.query(`DELETE FROM public.${table} WHERE id=$1 RETURNING id`, [insertedId])).rows).toHaveLength(1);
        });
      }
    });
  }

  for (const table of ["reconhecimentos", "reconhecimento_mencoes", "reconhecimento_curtidas", "reconhecimento_comentarios", "historico_ranking_mensal"] as const) {
    it(`${table}: shares the internal feed only with registered staff`, async () => {
      expect(await asViewer("member", (tx) => count(tx, table))).toBe(1);
      expect(await asViewer("leave", (tx) => count(tx, table))).toBe(1);
      for (const viewer of ["outsider", "guest", "dismissed"] as const) {
        expect(await asViewer(viewer, (tx) => count(tx, table))).toBe(0);
      }
    });
  }

  for (const table of ["checkin_sentimento", "respostas_pesquisa", "ferias_programadas"] as const) {
    it(`${table}: limits personal records to their owner, direct manager, and administrators`, async () => {
      for (const viewer of ["member", "manager", "admin"] as const) expect(await asViewer(viewer, (tx) => count(tx, table))).toBe(1);
      for (const viewer of ["other", "outsider", "guest", "dismissed"] as const) expect(await asViewer(viewer, (tx) => count(tx, table))).toBe(0);
    });
  }

  it("inventory: only creators and administrators can read or delete an entry", async () => {
    for (const viewer of ["other", "outsider"] as const) {
      expect(await asViewer(viewer, (tx) => count(tx, "inventory_mobile_entries"))).toBe(0);
      expect(await asViewer(viewer, (tx) => tx.query("DELETE FROM public.inventory_mobile_entries WHERE id=$1 RETURNING id", [fixtureId]))).toMatchObject({ rows: [] });
    }
    for (const viewer of ["member", "admin"] as const) {
      expect(await asViewer(viewer, (tx) => count(tx, "inventory_mobile_entries"))).toBe(1);
    }
    await asViewer("member", async (tx) => {
      const removed = await tx.query("DELETE FROM public.inventory_mobile_entries WHERE id=$1 RETURNING id", [fixtureId]);
      expect(removed.rows).toHaveLength(1);
    });
  });

  it("vacancies: only administrators can read or create recruitment records", async () => {
    for (const viewer of ["member", "manager", "outsider", "guest"] as const) {
      expect(await asViewer(viewer, (tx) => count(tx, "vagas"))).toBe(0);
      await expect(asViewer(viewer, (tx) => tx.query("INSERT INTO public.vagas (cargo_id,setor,titulo) VALUES ($1,'TI','Nova vaga')", [fixtureId]))).rejects.toThrow(/row-level security/);
    }
    expect(await asViewer("admin", (tx) => count(tx, "vagas"))).toBe(1);
    await asViewer("admin", async (tx) => {
      expect((await tx.query("INSERT INTO public.vagas (cargo_id,setor,titulo) VALUES ($1,'TI','Nova vaga') RETURNING id", [fixtureId])).rows).toHaveLength(1);
    });
  });

  it("notifications: permits only matching saved decisions and rejects forged senders and recipients", async () => {
    const insert = "INSERT INTO public.notificacoes (destinatario_email,tipo,texto,ator_nome) VALUES ($1,$2,$3,$4) RETURNING id";
    const valid = [accounts.member.email, "aviso_permitido", "permitiu sua solicitação de Aviso de Horas Extra", "manager"];
    for (const viewer of ["member", "outsider"] as const) await expect(asViewer(viewer, (tx) => tx.query(insert, valid))).rejects.toThrow(/row-level security/);
    await expect(asViewer("manager", (tx) => tx.query(insert, [accounts.other.email, ...valid.slice(1)]))).rejects.toThrow(/row-level security/);
    await expect(asViewer("manager", (tx) => tx.query(insert, [...valid.slice(0, 3), "admin"]))).rejects.toThrow(/row-level security/);
    await expect(asViewer("manager", (tx) => tx.query(insert, [accounts.member.email, "geral", "forged message", "manager"]))).rejects.toThrow(/row-level security/);
    await asViewer("manager", async (tx) => { expect((await tx.query(insert, valid)).rows).toHaveLength(1); });
    await asViewer("member", async (tx) => { expect(await count(tx, "notificacoes")).toBe(1); });
    await asViewer("other", async (tx) => { expect(await count(tx, "notificacoes")).toBe(0); });
  });

  it("holidays: preserves registered staff calendars without allowing arbitrary signup access", async () => {
    expect(await asViewer("member", (tx) => count(tx, "feriados_cadastrados"))).toBe(1);
    expect(await asViewer("outsider", (tx) => count(tx, "feriados_cadastrados"))).toBe(0);
    expect(await asViewer("guest", (tx) => count(tx, "feriados_cadastrados"))).toBe(0);
    // The unselected announcement finding must remain unchanged, not silently fixed.
    expect(await asViewer("outsider", (tx) => count(tx, "comunicados"))).toBe(1);
  });
});