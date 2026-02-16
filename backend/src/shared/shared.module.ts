import { Global, Module } from'@nestjs/common';
import { CryptoService } from'./crypto.service';
import { DatabaseService } from'./database.service';

/**
 * SharedModule provides CryptoService and DatabaseService globally.
 * No need to import SharedModule in individual feature modules.
 */
@Global()
@Module({
 providers: [CryptoService, DatabaseService],
 exports: [CryptoService, DatabaseService],
})
export class SharedModule {}
