function HorizontalRow({ overflow, children }) {
    return (
        <div style={{alignContent:"flex-end", alignItems:"center", display:"flex", gap:"12px", justifyContent:"flex-start", overflowX:(overflow ? "auto" : "")}}>
            {children}
        </div>
    );
}

export default HorizontalRow;