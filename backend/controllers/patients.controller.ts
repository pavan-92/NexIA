import { Request, Response } from 'express';
import { connectToDatabase } from '../config/database';
import { patients, insertPatientSchema } from '../models/schema';
import { eq, and } from 'drizzle-orm';
import { fromZodError } from 'zod-validation-error';

// Buscar todos os pacientes do médico
export async function getAllPatients(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const db = await connectToDatabase();
    const result = await db.select().from(patients).where(eq(patients.userId, userId));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return res.status(500).json({ 
      error: "Erro ao buscar pacientes",
      details: error instanceof Error ? error.message : undefined
    });
  }
}

// Buscar paciente por ID
export async function getPatientById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const db = await connectToDatabase();
    const result = await db.select()
      .from(patients)
      .where(and(
        eq(patients.id, id),
        eq(patients.userId, userId)
      ));

    if (result.length === 0) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error("Erro ao buscar paciente por ID:", error);
    return res.status(500).json({ 
      error: "Erro ao buscar paciente",
      details: error instanceof Error ? error.message : undefined
    });
  }
}

// Criar novo paciente
export async function createPatient(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;

    // Validar dados com Zod
    const validationResult = insertPatientSchema.safeParse({
      ...req.body,
      userId
    });

    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      return res.status(400).json({ 
        error: "Dados de paciente inválidos",
        details: validationError.message
      });
    }

    const newPatient = validationResult.data;
    
    // Inserir paciente no banco
    const db = await connectToDatabase();
    await db.insert(patients).values(newPatient);
    
    // Buscar o paciente recém-criado
    const result = await db.select().from(patients)
      .where(and(
        eq(patients.cpf, newPatient.cpf),
        eq(patients.userId, userId)
      ));

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return res.status(500).json({ 
      error: "Erro ao criar paciente",
      details: error instanceof Error ? error.message : undefined
    });
  }
}

// Atualizar paciente
export async function updatePatient(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const db = await connectToDatabase();

    // Verificar se o paciente existe e pertence ao médico
    const existingPatient = await db.select()
      .from(patients)
      .where(and(
        eq(patients.id, id),
        eq(patients.userId, userId)
      ));

    if (existingPatient.length === 0) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    // Atualizar os campos
    await db.update(patients)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(patients.id, id));
      
    // Buscar o paciente atualizado
    const result = await db.select().from(patients).where(eq(patients.id, id));

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return res.status(500).json({ 
      error: "Erro ao atualizar paciente",
      details: error instanceof Error ? error.message : undefined
    });
  }
}

// Excluir paciente
export async function deletePatient(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const db = await connectToDatabase();

    // Verificar se o paciente existe e pertence ao médico
    const existingPatient = await db.select()
      .from(patients)
      .where(and(
        eq(patients.id, id),
        eq(patients.userId, userId)
      ));

    if (existingPatient.length === 0) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    // Excluir o paciente
    await db.delete(patients)
      .where(eq(patients.id, id));

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir paciente:", error);
    return res.status(500).json({ 
      error: "Erro ao excluir paciente",
      details: error instanceof Error ? error.message : undefined
    });
  }
}