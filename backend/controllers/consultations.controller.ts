import { Request, Response } from 'express';
import { connectToDatabase } from '../config/database';
import { consultations, insertConsultationSchema } from '../models/schema';
import { eq, and } from 'drizzle-orm';
import { fromZodError } from 'zod-validation-error';

// Buscar todas as consultas do médico
export async function getAllConsultations(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const db = await connectToDatabase();
    const result = await db.select().from(consultations).where(eq(consultations.userId, userId));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar consultas:", error);
    return res.status(500).json({ 
      error: "Erro ao buscar consultas",
      details: error instanceof Error ? error.message : undefined
    });
  }
}

// Buscar consultas por ID de paciente
export async function getConsultationsByPatientId(req: Request, res: Response) {
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const db = await connectToDatabase();
    const result = await db.select()
      .from(consultations)
      .where(
        and(
          eq(consultations.patientId, patientId),
          eq(consultations.userId, userId)
        )
      );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar consultas por paciente:", error);
    return res.status(500).json({ 
      error: "Erro ao buscar consultas",
      details: error instanceof Error ? error.message : undefined
    });
  }
}

// Buscar consulta por ID
export async function getConsultationById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de consulta inválido" });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const db = await connectToDatabase();
    const result = await db.select()
      .from(consultations)
      .where(
        and(
          eq(consultations.id, id),
          eq(consultations.userId, userId)
        )
      );

    if (result.length === 0) {
      return res.status(404).json({ error: "Consulta não encontrada" });
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error("Erro ao buscar consulta por ID:", error);
    return res.status(500).json({ 
      error: "Erro ao buscar consulta",
      details: error instanceof Error ? error.message : undefined
    });
  }
}

// Criar nova consulta
export async function createConsultation(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;

    // Validar dados com Zod
    const validationResult = insertConsultationSchema.safeParse({
      ...req.body,
      userId
    });

    if (!validationResult.success) {
      const validationError = fromZodError(validationResult.error);
      return res.status(400).json({ 
        error: "Dados de consulta inválidos",
        details: validationError.message
      });
    }

    const newConsultation = validationResult.data;
    
    // Inserir consulta no banco
    const db = await connectToDatabase();
    // Para MySQL precisamos usar um único valor, não um array
    // Convertendo o objeto notes para string JSON se estiver presente
    const notesValue = newConsultation.notes ? JSON.stringify(newConsultation.notes) : null;
    
    await db.insert(consultations).values({
      patientId: newConsultation.patientId,
      userId: newConsultation.userId,
      date: newConsultation.date,
      transcription: newConsultation.transcription || null,
      notes: notesValue as any, // Usamos 'as any' para resolver o problema de tipo
      status: newConsultation.status || 'pending',
      duration: newConsultation.duration || null
    });
    
    // Buscar a consulta recém-criada
    const result = await db.select().from(consultations)
      .where(
        and(
          eq(consultations.date, newConsultation.date),
          eq(consultations.patientId, newConsultation.patientId),
          eq(consultations.userId, userId)
        )
      );

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Erro ao criar consulta:", error);
    return res.status(500).json({ 
      error: "Erro ao criar consulta",
      details: error instanceof Error ? error.message : undefined
    });
  }
}

// Atualizar consulta
export async function updateConsultation(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de consulta inválido" });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const db = await connectToDatabase();

    // Verificar se a consulta existe e pertence ao médico
    const existingConsultation = await db.select()
      .from(consultations)
      .where(
        and(
          eq(consultations.id, id),
          eq(consultations.userId, userId)
        )
      );

    if (existingConsultation.length === 0) {
      return res.status(404).json({ error: "Consulta não encontrada" });
    }

    // Atualizar os campos
    await db.update(consultations)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(consultations.id, id));
      
    // Buscar a consulta atualizada
    const result = await db.select().from(consultations).where(eq(consultations.id, id));

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error("Erro ao atualizar consulta:", error);
    return res.status(500).json({ 
      error: "Erro ao atualizar consulta",
      details: error instanceof Error ? error.message : undefined
    });
  }
}

// Excluir consulta
export async function deleteConsultation(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de consulta inválido" });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = req.user.id;
    const db = await connectToDatabase();

    // Verificar se a consulta existe e pertence ao médico
    const existingConsultation = await db.select()
      .from(consultations)
      .where(
        and(
          eq(consultations.id, id),
          eq(consultations.userId, userId)
        )
      );

    if (existingConsultation.length === 0) {
      return res.status(404).json({ error: "Consulta não encontrada" });
    }

    // Excluir a consulta
    await db.delete(consultations)
      .where(eq(consultations.id, id));

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir consulta:", error);
    return res.status(500).json({ 
      error: "Erro ao excluir consulta",
      details: error instanceof Error ? error.message : undefined
    });
  }
}