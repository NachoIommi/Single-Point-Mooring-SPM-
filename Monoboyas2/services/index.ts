import { OperacionService } from "./OperacionService";
import { 
  MedicionRepository, 
  AlertaRepository, 
  OperacionRepository, 
  UsuarioAlertaRepository,
  UsuarioRepository
} from "@/persistence/lib/repositories";
import { CentralDatos } from "@/domain/entities/CentralDatos";

const medicionRepo = new MedicionRepository();
const alertaRepo = new AlertaRepository();
const operacionRepo = new OperacionRepository();
const usuarioAlertaRepo = new UsuarioAlertaRepository();
const usuarioRepo = new UsuarioRepository();

export const centralDatos = new CentralDatos(medicionRepo, alertaRepo, operacionRepo, usuarioAlertaRepo);
export const operacionService = new OperacionService(operacionRepo, usuarioRepo, centralDatos);
