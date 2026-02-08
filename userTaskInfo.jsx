import ListGroup from 'react-bootstrap/ListGroup';

function UserTaskInfo() {
     return (
          <div
               style={{
                    width: '18rem',
                    padding: "10px",
                    backgroundColor: "#001F46", color: "#E9E4De",
               }}
          >
               <ListGroup as="ul" variant="flush" style={{ background: "transparent" }}>
                    <ListGroup.Item
                         as="li"
                         style={{
                              backgroundColor: "#001F46",
                              color: "#E9E4De",
                              fontWeight: "bold",
                              borderRadius: "6px",
                              marginBottom: "6px",
                              cursor: "pointer"
                         }}
                    >
                         Projects
                    </ListGroup.Item>

                    <ListGroup.Item
                         as="li"
                         style={{
                              background: "#001F46",
                              color: "#E9E4De",
                              fontWeight: "bold",
                              borderRadius: "6px",
                              marginBottom: "6px",
                              cursor: "pointer"
                         }}
                    >

                         Tasks
                    </ListGroup.Item>

                    <ListGroup.Item
                         as="li"
                         style={{
                              background: "#001F46",
                              color: "#E9E4De",
                              fontWeight: "bold",
                              borderRadius: "6px",
                              marginBottom: "6px",
                              cursor: "pointer"
                         }}
                    >
                         What you think update here
                    </ListGroup.Item>

                    <ListGroup.Item
                         as="li"
                         style={{
                              background: "#001F46",
                              color: "#E9E4De",
                              fontWeight: "bold",
                              borderRadius: "6px",
                              marginBottom: "6px",
                              cursor: "pointer"
                         }}
                    >
                         Here also
                    </ListGroup.Item>
               </ListGroup>
          </div>
     );
}

export default UserTaskInfo;
