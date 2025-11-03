function HorizontalRow({ overflow, children }) {
    return (
        <div style={{alignContent:"flex-end", alignItems:"center", display:"flex", gap:"12px", justifyContent:"flex-start", margin:"0px 0", overflowX:(overflow ? "auto" : ""), padding:"0.5rem"}}>
            {children}
        </div>
    );
}

export default HorizontalRow;