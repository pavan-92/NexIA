import express from 'express';
import { 
  getAllConsultations, 
  getConsultationsByPatientId,
  getConsultationById, 
  createConsultation, 
  updateConsultation, 
  deleteConsultation 
} from '../controllers/consultations.controller';
import { validateAuth } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(validateAuth);

// Obter todas as consultas do usuário autenticado
router.get('/', getAllConsultations);

// Obter consultas por ID do paciente
router.get('/patient/:patientId', getConsultationsByPatientId);

// Obter uma consulta específica por ID
router.get('/:id', getConsultationById);

// Criar uma nova consulta
router.post('/', createConsultation);

// Atualizar uma consulta existente
router.put('/:id', updateConsultation);

// Excluir uma consulta
router.delete('/:id', deleteConsultation);

export default router;