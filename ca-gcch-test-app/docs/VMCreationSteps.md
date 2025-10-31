
# 🖥️ VM Configuration Steps

## Phase 0: VM Prerequisites & Initial Setup

### Create Azure VM with Proper Network Configuration

**In Azure Portal:**

1. Go to **Virtual Machines** → **Create** → **Azure virtual machine**
2. **Basics tab:**
	 - **Subscription:** Your subscription
	 - **Resource group:** Create new or use existing
	 - **Virtual machine name:** `gcch-nodejs-vm`
	 - **Region:** Select appropriate region
	 - **Image:** Windows Server 2019/2022 Datacenter
	 - **Size:** `Standard_B2s` (2 vCPUs, 4 GB RAM) or larger
	 - **Administrator account:**
		 - **Username:** `azureuser` (or your preference)
		 - **Password:** Strong password (**save it!**)
	 - **Inbound port rules:**
		 - Select **Allow selected ports**
		 - Select **RDP (3389)** for remote access
	 - **Load balancing:** None

3. **Complete VM Creation**
	 - Review settings and click **Create**
	 - Wait for deployment (5-10 minutes)
	 - Note the **Public IP address** from the overview page

## Connect to VM and Run Deployment Script

1. Connect via **RDP**
