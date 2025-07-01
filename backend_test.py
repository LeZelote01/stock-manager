import requests
import sys
import uuid
import json
import base64
import websocket
import threading
import time
from datetime import datetime, timedelta
from io import BytesIO

class StockManagementAPITester:
    def __init__(self, base_url="https://69536b33-4600-4b5f-b199-1ee029333aca.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.ws_url = f"{base_url.replace('https://', 'wss://')}/ws"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            "materials": [],
            "agents": [],
            "superviseurs": [],
            "chef_section": [],
            "fournisseurs": []
        }
        self.ws_notifications = []
        self.ws_connected = False

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
            
    def connect_websocket(self):
        """Connect to WebSocket for real-time notifications"""
        def on_message(ws, message):
            print(f"WebSocket message received: {message}")
            try:
                data = json.loads(message)
                self.ws_notifications.append(data)
            except:
                print(f"Failed to parse WebSocket message: {message}")
                
        def on_error(ws, error):
            print(f"WebSocket error: {error}")
            
        def on_close(ws, close_status_code, close_msg):
            print(f"WebSocket connection closed: {close_status_code} - {close_msg}")
            self.ws_connected = False
            
        def on_open(ws):
            print("WebSocket connection established")
            self.ws_connected = True
            
        def run_websocket():
            ws = websocket.WebSocketApp(
                self.ws_url,
                on_open=on_open,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )
            ws.run_forever()
            
        print(f"\n🔌 Connecting to WebSocket at {self.ws_url}...")
        self.ws_thread = threading.Thread(target=run_websocket)
        self.ws_thread.daemon = True
        self.ws_thread.start()
        
        # Wait for connection to establish
        timeout = 5
        start_time = time.time()
        while not self.ws_connected and time.time() - start_time < timeout:
            time.sleep(0.1)
            
        if self.ws_connected:
            print("✅ WebSocket connected successfully")
            return True
        else:
            print("❌ WebSocket connection failed")
            return False

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
        
        # Create two agents specifically for this test to ensure they exist
        agent_name1 = f"Test Agent {uuid.uuid4().hex[:8]}"
        agent_matricule1 = f"A{uuid.uuid4().hex[:6]}"
        success1, created_agent1 = self.run_test(
            "Create Agent 1 for Demande",
            "POST",
            "agents",
            200,
            data={"nom": agent_name1, "matricule": agent_matricule1}
        )
        
        agent_name2 = f"Test Agent {uuid.uuid4().hex[:8]}"
        agent_matricule2 = f"A{uuid.uuid4().hex[:6]}"
        success2, created_agent2 = self.run_test(
            "Create Agent 2 for Demande",
            "POST",
            "agents",
            200,
            data={"nom": agent_name2, "matricule": agent_matricule2}
        )
        
        if not self.created_ids["superviseurs"]:
            self.test_superviseurs_crud()
        
        # GET all demandes
        success, demandes = self.run_test(
            "Get All Demandes",
            "GET",
            "demandes",
            200
        )
        
        if success1 and success2 and 'id' in created_agent1 and 'id' in created_agent2:
            # CREATE a demande
            material_id = self.created_ids["materials"][0]
            superviseur_id = self.created_ids["superviseurs"][0]
            agent1_id = created_agent1['id']
            agent2_id = created_agent2['id']
            
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
        return False

    def test_stock_alerts(self):
        """Test stock alerts"""
        print("\n=== Testing Stock Alerts ===")
        
        # First, ensure we have materials
        if not self.created_ids["materials"]:
            self.test_materials_crud()
            
        # Create materials with different quantities to test all alert levels
        material_critical = f"Critical Stock Material {uuid.uuid4().hex[:8]}"
        success_critical, created_critical = self.run_test(
            "Create Critical Stock Material",
            "POST",
            "materials",
            200,
            data={"nom": material_critical, "quantite": 3}
        )
        
        material_low = f"Low Stock Material {uuid.uuid4().hex[:8]}"
        success_low, created_low = self.run_test(
            "Create Low Stock Material",
            "POST",
            "materials",
            200,
            data={"nom": material_low, "quantite": 10}
        )
        
        material_normal = f"Normal Stock Material {uuid.uuid4().hex[:8]}"
        success_normal, created_normal = self.run_test(
            "Create Normal Stock Material",
            "POST",
            "materials",
            200,
            data={"nom": material_normal, "quantite": 30}
        )
        
        # Test the stock-alerts endpoint
        success, alerts = self.run_test(
            "Get Stock Alerts",
            "GET",
            "stock-alerts",
            200
        )
        
        if success:
            print("Stock alerts response received successfully")
            
            # Verify the response structure and alert levels
            if not alerts:
                print("❌ No alerts returned")
                return False
                
            # Check if we have alerts with different levels
            alert_levels = set(alert["level"] for alert in alerts)
            print(f"Alert levels found: {', '.join(alert_levels)}")
            
            # Verify that each material has the correct alert level
            for alert in alerts:
                material = alert["material"]
                level = alert["level"]
                
                if material["quantite"] <= 5:
                    expected_level = "critique"
                elif material["quantite"] <= 15:
                    expected_level = "bas"
                else:
                    expected_level = "normal"
                    
                if level != expected_level:
                    print(f"❌ Material '{material['nom']}' with quantity {material['quantite']} has incorrect alert level: {level}, expected: {expected_level}")
                    return False
                    
            print("✅ All stock alerts have correct levels")
            return True
        
        return False

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