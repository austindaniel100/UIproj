import SideNav, {Toggle, NavItem, NavIcon, NavText,} from "@trendmicro/react-sidenav";
import React, { useState, useEffect } from 'react';
import "@trendmicro/react-sidenav/dist/react-sidenav.css"
import './App.css';


function extractLinksFromResponse(response) {
    // Use a regex to extract links from the response
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g;
    const links = [];
    let match;
  
    while ((match = linkRegex.exec(response)) !== null) {
      links.push(match[1]);
    }
  
    return links;
  }


function MySideNav(){
    const [links, setLinks] = useState([]);
// fetch chat history data or current message data --??

      return (
        <SideNav
          onSelect={(selected) => {
            console.log(selected);
          }}
        >
          <SideNav.Toggle />
          <SideNav.Nav defaultSelected="home">
            <NavItem>
              <NavIcon><i className='fa fa-fw fa-home' style={{ fontSize: 1.5 }}></i></NavIcon>
              <NavText>Home</NavText>
            </NavItem>
            <NavItem>
              <NavIcon><i className="fa-regular fa-file-pdf" style={{ fontSize: 1.5 }}></i></NavIcon>
              <NavText>PDF</NavText>
            </NavItem>
            {/* Generate NavItems dynamically based on extracted links */}
            {links.map((link, index) => (
              <NavItem key={index}>
                <NavIcon><i className="fa-solid fa-link" style={{ fontSize: 1.5 }}></i></NavIcon>
                <NavText>{`Link ${index + 1}`}</NavText>
              </NavItem>
            ))}
          </SideNav.Nav>
        </SideNav>
      );


}
export default MySideNav;