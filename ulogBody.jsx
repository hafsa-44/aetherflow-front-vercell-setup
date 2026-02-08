import CardSlider from "./projectScroller ";
import UserTaskBar from "./userIdTaskBar";
function UserLogBody() {
     return (
          <div className=""
          // style={{ background: "#7699AE", height: "90vh", width: "100%" }}
          >
               {/* user info card and task bar */}
               <div>
                    <UserTaskBar />
               </div>
               {/* user project details and scroller */}
               <div>
                    <CardSlider />
               </div>
               {/* user analytics */}
               <div>

               </div>
          </div>
     )
}
export default UserLogBody;