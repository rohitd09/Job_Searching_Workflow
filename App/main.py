from fastapi import FastAPI

app = FastAPI(name="Job Finding API",
              version="0.1.0",
              description="API to find relevant and best to apply jobs based on my profile")

@app.get("/")
def root() -> dict:
    return {"message": "The Job Finding API is live......"}

@app.get("/health")
def health_check() -> dict:
    return {"status": "OK"}

#-------------------------------------------------------------------------------------
# Post Method -> Create a new data
#-------------------------------------------------------------------------------------

data = set()

@app.post("/add-item")
def add_new_item(item: str) -> dict:
    data.add(item)
    return {"message": f"{item} succesfully added to the database"}

# /add-item -> add_new_item()
# /add-item?item=Atomic%20Habits -> add_new_item("Atomic Habits")

#-------------------------------------------------------------------------------------
# Get Method -> Read data from the database
#-------------------------------------------------------------------------------------

@app.get("/display-all-items")
def display_all_items() -> dict:
    print(f"The data is : {data}")
    return {"message": f"Following items are in the database: {data}"}

@app.get("/verify-item/{item_name}")
def verify_item(item_name: str) -> dict:
    if item_name in data:
        return {"message": f"{item_name} is present in the database"}
    return {"message": f"{item_name} is not present in the database"}

#-------------------------------------------------------------------------------------
# Put Method -> Update data in the database
#-------------------------------------------------------------------------------------

@app.put("/update-item")
def update_item(existing_item: str, new_item: str) -> dict:
    if existing_item not in data:
        return {"message": f"{existing_item} is not present in the database"}

    data.remove(existing_item)
    data.add(new_item)
    return {"message": f"{existing_item} has been updated to {new_item}"}

# Domain/update-item
# Domainupdate-item {Pls Avoid This}

#-------------------------------------------------------------------------------------
# Delete Method -> Delete data in the database
#-------------------------------------------------------------------------------------

@app.delete("/delete-item")
def delete_item(item: str) -> dict:
    if item not in data:
        return {"message": f"{item} is not present in the database"}

    data.remove(item)
    return {"message": f"{item} has been deleted from the database"}

@app.delete("/delete-all-items")
def delete_all_items() -> dict:
    data.clear()
    return {"message": "All items have been deleted from the database"}

from App.workflows.workflow import ExecuteWorkflow

@app.post("/execute-workflow")
def process_workflow():
    agent = ExecuteWorkflow()
    result = agent.run_workflow()
    return result