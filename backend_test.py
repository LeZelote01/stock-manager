import requests
import sys
import uuid
from datetime import datetime

class StockManagementAPITester:
    def __init__(self, base_url="https://69536b33-4600-4b5f-b199-1ee029333aca.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            "materials": [],
            "agents": [],
            "superviseurs": [],
            "chef_section": []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json() if response.text else 'No content'}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, password="admin123"):
        """Test admin login"""
        print("\n=== Testing Admin Authentication ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "login",
            200,
            data={"password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"Admin login successful, token: {self.token}")
            return True
        return False

    def test_materials_crud(self):
        """Test CRUD operations for materials"""
        print("\n=== Testing Materials CRUD ===")
        
        # GET all materials
        success, materials = self.run_test(
            "Get All Materials",
            "GET",
            "materials",
            200
        )
        
        # CREATE a material
        material_name = f"Test Material {uuid.uuid4().hex[:8]}"
        success, created_material = self.run_test(
            "Create Material",
            "POST",
            "materials",
            200,
            data={"nom": material_name, "quantite": 50}
        )
        
        if success and 'id' in created_material:
            material_id = created_material['id']
            self.created_ids["materials"].append(material_id)
            
            # UPDATE the material
            success, updated_material = self.run_test(
                "Update Material",
                "PUT",
                f"materials/{material_id}",
                200,
                data={"quantite": 75}
            )
            
            # DELETE the material
            success, _ = self.run_test(
                "Delete Material",
                "DELETE",
                f"materials/{material_id}",
                200
            )
            
            return True
        return False

    def test_agents_crud(self):
        """Test CRUD operations for agents"""
        print("\n=== Testing Agents CRUD ===")
        
        # GET all agents
        success, agents = self.run_test(
            "Get All Agents",
            "GET",
            "agents",
            200
        )
        
        # CREATE an agent
        agent_name = f"Test Agent {uuid.uuid4().hex[:8]}"
        agent_matricule = f"A{uuid.uuid4().hex[:6]}"
        success, created_agent = self.run_test(
            "Create Agent",
            "POST",
            "agents",
            200,
            data={"nom": agent_name, "matricule": agent_matricule}
        )
        
        if success and 'id' in created_agent:
            agent_id = created_agent['id']
            self.created_ids["agents"].append(agent_id)
            
            # UPDATE the agent
            new_name = f"Updated Agent {uuid.uuid4().hex[:8]}"
            success, updated_agent = self.run_test(
                "Update Agent",
                "PUT",
                f"agents/{agent_id}",
                200,
                data={"nom": new_name, "matricule": agent_matricule}
            )
            
            # We'll keep one agent for testing demandes
            if len(self.created_ids["agents"]) > 1:
                # DELETE the agent
                success, _ = self.run_test(
                    "Delete Agent",
                    "DELETE",
                    f"agents/{agent_id}",
                    200
                )
            
            return True
        return False

    def test_superviseurs_crud(self):
        """Test CRUD operations for superviseurs"""
        print("\n=== Testing Superviseurs CRUD ===")
        
        # GET all superviseurs
        success, superviseurs = self.run_test(
            "Get All Superviseurs",
            "GET",
            "superviseurs",
            200
        )
        
        # CREATE a superviseur
        superviseur_name = f"Test Superviseur {uuid.uuid4().hex[:8]}"
        superviseur_matricule = f"S{uuid.uuid4().hex[:6]}"
        success, created_superviseur = self.run_test(
            "Create Superviseur",
            "POST",
            "superviseurs",
            200,
            data={"nom": superviseur_name, "matricule": superviseur_matricule}
        )
        
        if success and 'id' in created_superviseur:
            superviseur_id = created_superviseur['id']
            self.created_ids["superviseurs"].append(superviseur_id)
            
            # UPDATE the superviseur
            new_name = f"Updated Superviseur {uuid.uuid4().hex[:8]}"
            success, updated_superviseur = self.run_test(
                "Update Superviseur",
                "PUT",
                f"superviseurs/{superviseur_id}",
                200,
                data={"nom": new_name, "matricule": superviseur_matricule}
            )
            
            # We'll keep one superviseur for testing demandes
            if len(self.created_ids["superviseurs"]) > 1:
                # DELETE the superviseur
                success, _ = self.run_test(
                    "Delete Superviseur",
                    "DELETE",
                    f"superviseurs/{superviseur_id}",
                    200
                )
            
            return True
        return False

    def test_chef_section_crud(self):
        """Test CRUD operations for chef section"""
        print("\n=== Testing Chef Section CRUD ===")
        
        # GET all chef section
        success, chefs = self.run_test(
            "Get All Chef Section",
            "GET",
            "chef-section",
            200
        )
        
        # CREATE a chef section
        chef_name = f"Test Chef {uuid.uuid4().hex[:8]}"
        chef_matricule = f"C{uuid.uuid4().hex[:6]}"
        success, created_chef = self.run_test(
            "Create Chef Section",
            "POST",
            "chef-section",
            200,
            data={"nom": chef_name, "matricule": chef_matricule}
        )
        
        if success and 'id' in created_chef:
            chef_id = created_chef['id']
            self.created_ids["chef_section"].append(chef_id)
            
            # UPDATE the chef section
            new_name = f"Updated Chef {uuid.uuid4().hex[:8]}"
            success, updated_chef = self.run_test(
                "Update Chef Section",
                "PUT",
                f"chef-section/{chef_id}",
                200,
                data={"nom": new_name, "matricule": chef_matricule}
            )
            
            # DELETE the chef section
            success, _ = self.run_test(
                "Delete Chef Section",
                "DELETE",
                f"chef-section/{chef_id}",
                200
            )
            
            return True
        return False

    def test_demandes(self):
        """Test demandes operations"""
        print("\n=== Testing Demandes ===")
        
        # First, ensure we have materials, agents, and superviseurs
        if not self.created_ids["materials"]:
            self.test_materials_crud()
        
        if len(self.created_ids["agents"]) < 2:
            self.test_agents_crud()
            self.test_agents_crud()
        
        if not self.created_ids["superviseurs"]:
            self.test_superviseurs_crud()
        
        # GET all demandes
        success, demandes = self.run_test(
            "Get All Demandes",
            "GET",
            "demandes",
            200
        )
        
        # CREATE a demande
        material_id = self.created_ids["materials"][0]
        superviseur_id = self.created_ids["superviseurs"][0]
        agent1_id = self.created_ids["agents"][0]
        agent2_id = self.created_ids["agents"][1]
        
        success, created_demande = self.run_test(
            "Create Demande",
            "POST",
            "demandes",
            200,
            data={
                "superviseur_id": superviseur_id,
                "agent1_id": agent1_id,
                "agent2_id": agent2_id,
                "materiels_demandes": {material_id: 5},
                "signature": "Test Signature"
            }
        )
        
        return success

    def test_stock_alerts(self):
        """Test stock alerts"""
        print("\n=== Testing Stock Alerts ===")
        
        success, alerts = self.run_test(
            "Get Stock Alerts",
            "GET",
            "stock-alerts",
            200
        )
        
        return success

def main():
    # Setup
    tester = StockManagementAPITester()
    
    # Run tests
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1

    # Test all CRUD operations
    tester.test_materials_crud()
    tester.test_agents_crud()
    tester.test_superviseurs_crud()
    tester.test_chef_section_crud()
    
    # Test demandes and stock alerts
    tester.test_demandes()
    tester.test_stock_alerts()

    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())