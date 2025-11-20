// ============ TRIMBLE CONNECT API CLIENT ============
// Tento soubor obsahuje všechny API integrace s Trimble Connect Services

class TrimbleConnectAPIClient {
  constructor() {
    this.baseUrl = 'https://app.connect.trimble.com/tc/api/3.0';
    this.accessToken = null;
    this.projectId = null;
    this.workspaceApi = null;
    this.initialized = false;
  }

  // ============ INICIALIZACE ============
  
  async initialize() {
    try {
      // Otevri Workspace API pro komunikaci s Trimble Connect
      const { connect } = window.trimbleConnect;
      
      this.workspaceApi = await connect(window.parent, (event, args) => {
        this.handleWorkspaceEvent(event, args);
      }, 30000);

      // Získej access token
      this.accessToken = await this.workspaceApi.requestAccessToken();
      
      // Získej aktuální projekt
      const project = await this.workspaceApi.project.getProject();
      this.projectId = project.id;
      
      this.initialized = true;
      console.log('✓ Trimble Connect API inicializován', {
        projectId: this.projectId,
        token: this.accessToken ? 'OK' : 'CHYBA'
      });
      
      return true;
    } catch (error) {
      console.error('✗ Inicializace API selhala:', error);
      throw error;
    }
  }

  handleWorkspaceEvent(event, args) {
    console.log('Workspace Event:', event, args);
    
    switch (event) {
      case 'extension.accessToken':
        this.accessToken = args.data;
        break;
      case 'extension.userSettingsChanged':
        console.log('Nastavení uživatele změněno');
        break;
      case 'extension.command':
        console.log('Příkaz od uživatele:', args.data);
        break;
    }
  }

  // ============ CORE SERVICE - Práce se složkami a soubory ============

  async getFolders() {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/folders`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při načítání složek:', error);
      throw error;
    }
  }

  async getFolder(folderId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/folders/${folderId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při načítání složky:', error);
      throw error;
    }
  }

  async getFolderFiles(folderId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/folders/${folderId}/files`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při načítání souborů:', error);
      throw error;
    }
  }

  async createFolder(parentFolderId, folderName) {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderName,
            parentId: parentFolderId
          })
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při vytváření složky:', error);
      throw error;
    }
  }

  async moveFolder(folderId, destinationFolderId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/folders/${folderId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parentId: destinationFolderId
          })
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při přesunutí složky:', error);
      throw error;
    }
  }

  // ============ TOPICS SERVICE - BCF Management ============

  async createBCFTopic(title, assignedToUserId, priority = 'high', description = '') {
    try {
      const bcfData = {
        title: title,
        description: description,
        assignedTo: assignedToUserId,
        priority: priority,
        status: 'New',
        type: 'Issue',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/topics`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bcfData)
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const topic = await response.json();
      
      console.log('✓ BCF Topic vytvořen:', topic);
      return topic;
    } catch (error) {
      console.error('✗ Chyba při vytváření BCF Topic:', error);
      throw error;
    }
  }

  async updateBCFTopic(topicId, updateData) {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/topics/${topicId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při aktualizaci BCF Topic:', error);
      throw error;
    }
  }

  async addBCFComment(topicId, comment) {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/topics/${topicId}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: comment
          })
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při přidání komentáře:', error);
      throw error;
    }
  }

  async resolveBCFTopic(topicId, resolution = 'Resolved') {
    try {
      return await this.updateBCFTopic(topicId, {
        status: resolution,
        resolvedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Chyba při uzavření BCF Topic:', error);
      throw error;
    }
  }

  // ============ PROJECT SERVICE - Uživatelé a metadata ============

  async getProjectUsers() {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/members`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při načítání uživatelů:', error);
      throw error;
    }
  }

  async getProjectMetadata() {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při načítání metadat projektu:', error);
      throw error;
    }
  }

  // ============ ORGANIZER SERVICE - Hierarchické struktury ============

  async getOrganizers(folderId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${this.projectId}/organizers?folderId=${folderId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Chyba při načítání organizátorů:', error);
      throw error;
    }
  }

  // ============ HELPER METODY ============

  async initializeWorkflow(folderId, approverUserIds, description) {
    try {
      console.log('📋 Inicializace schvalovacího workflow...');
      
      // Ověř přístup ke složce
      const folder = await this.getFolder(folderId);
      console.log('✓ Složka nalezena:', folder.name);

      // Vytvoř BCF pro prvního schvalujícího
      if (approverUserIds.length > 0) {
        const firstApproverId = approverUserIds[0];
        const topic = await this.createBCFTopic(
          `Schválení dokumentace: ${folder.name}`,
          firstApproverId,
          'high',
          description || `Prosím, schvalte dokumentaci ve složce: ${folder.name}`
        );
        
        console.log('✓ BCF notifikace vytvořena pro prvního schvalujícího');
        return topic;
      }
      
    } catch (error) {
      console.error('✗ Chyba při inicializaci workflow:', error);
      throw error;
    }
  }

  async proceedToNextApprover(currentTopicId, nextApproverUserId, description) {
    try {
      console.log('⏭️ Přesun na dalšího schvalujícího...');
      
      // Uzavři aktuální BCF
      await this.resolveBCFTopic(currentTopicId, 'Resolved');
      
      // Vytvoř BCF pro dalšího schvalujícího
      const topic = await this.createBCFTopic(
        description,
        nextApproverUserId,
        'high',
        description
      );
      
      console.log('✓ Notifikace odeslána dalšímu schvalujícímu');
      return topic;
      
    } catch (error) {
      console.error('✗ Chyba při přechodu na dalšího schvalujícího:', error);
      throw error;
    }
  }

  async finalizeApproval(folderId, approvedFolderName = 'Schválené') {
    try {
      console.log('✓ Finalizace schválení dokumentace...');
      
      // Najdi nebo vytvoř cílovou složku
      const folders = await this.getFolders();
      let approvedFolder = folders.find(f => f.name === approvedFolderName);
      
      if (!approvedFolder) {
        console.log(`📁 Vytváření složky "${approvedFolderName}"...`);
        approvedFolder = await this.createFolder(null, approvedFolderName);
      }
      
      // Přesuň složku dokumentace
      await this.moveFolder(folderId, approvedFolder.id);
      console.log(`✓ Dokumentace přesunuta do "${approvedFolderName}"`);
      
      return approvedFolder;
      
    } catch (error) {
      console.error('✗ Chyba při finalizaci:', error);
      throw error;
    }
  }
}

// ============ EXPORT ============
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrimbleConnectAPIClient;
}
