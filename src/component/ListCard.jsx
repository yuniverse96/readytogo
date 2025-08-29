
export default function ListCard({codi, onRemove}) {

    return(
        <>
            <button className="remove" type="button" onClick={() => onRemove(codi.id)}>삭제</button>
            <div className="top_info">
                <span>{codi.date}</span>
                <p>{codi.meetingPlace}</p>
            </div>
            <div className="bottom_info">
                <div className="img_box">
                    <img src={`${process.env.PUBLIC_URL}/images/${codi.faceIcon}.png`} alt={codi.faceIcon} />
                </div>
                <p className="plan"><b>{codi.meetingTime}</b> <b className={codi.faceIcon}>{codi.feelTemp}°</b></p>
                <p className="recommend">추천: {codi.recommendation}</p>
            </div>
        </>
    )
}
