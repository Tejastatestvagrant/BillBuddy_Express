
const fs= require('fs');

// Function to fetch group members from the server
function fetchGroupMembers() {
  fetch("/getGroupMembers") // Replace this URL with the appropriate server endpoint
    .then(response => response.json())
    .then(members => {
      const groupList = document.getElementById("groupList");
      groupList.innerHTML = ""; // Clear existing content

      members.forEach(member => {
        const memberDiv = document.createElement("div");
        memberDiv.textContent = member.name;
        groupList.appendChild(memberDiv);
      });
    })
    .catch(error => {
      console.error("Error fetching group members:", error);
    });
}

// Call fetchGroupMembers() function to get the group members when the page loads
fetchGroupMembers();

// Function to show alert messages
function showAlert(message, type) {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} mt-3`;
  alertDiv.textContent = message;

  const container = document.querySelector(".container");
  container.appendChild(alertDiv);


  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

document.getElementById("addMemberForm").addEventListener("submit", function (event) {
event.preventDefault();

const MemberName = document.getElementById("addMemberName").value;
const curname=document.getElementById("currentuser").value;
const users=fs.readFileSync('./users.json');

const currentUser=users.find(user=>user.name===curname);
if(currentUser)
{

  if( !currentUser.group.inculdes(MemberName))
{
   if(users.find(user=>user.name===MemberName))
   {
    currentUser.group.push(MemberName);
    showAlert("Member Added Successfully ","success");

    fs.writeFileSync('./users.json', JSON.stringify(users));
    fetchGroupMembers();
   }


}else{
  showAlert("member is already there","danger")
}
}
else{
  showAlert("invalid usersname","danger")
}





});


// Function to handle removing a member from the group
document.getElementById("removeMemberForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const removeMemberName = document.getElementById("removeMemberName").value;
  const cur=document.getElementById("currentuser").value;

  // Send the member data to the server for removing from the group
  fetch("/removeMember", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ memberName: removeMemberName ,currentUser:cur }),
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    // Optionally, you can display a success message to the user after removing the member
    fetchGroupMembers(); // Refresh the list of group members after removing a member
    showAlert(data.message, "success"); // Show success alert message
  })
  .catch(error => {
    console.error(`Error removing member: ${error}`);
    // Optionally, you can display an error message to the user if removing member fails
    showAlert("Error removing member. Please try again.", "danger"); // Show error alert message
  });
});

// Function to handle the "View Members" button click
document.getElementById("viewMembersBtn").addEventListener("click", function () {
  fetchGroupMembers();
});
