import UserCard from './userIdCard.jsx'
import UserTaskInfo from './userTaskInfo.jsx'

function UserTaskBar() {
     return (
          <div className="fixed h-screen w-72 left-0 top-0 drop-shadow-2xl
  mt-16 "
               style={{ backgroundColor: "#001F46", color: "#E9E4De" }}
          >
               <UserCard />
               {/* <userCard /> */}
               <UserTaskInfo />
          </div>
     )
}
export default UserTaskBar;