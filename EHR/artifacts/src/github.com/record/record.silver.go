package main

import (
	"fmt"
	"strconv"
	// "github.com/hyperledger/fabric/common/flogging"
    "github.com/hyperledger/fabric/core/chaincode/shim"
    pb "github.com/hyperledger/fabric/protos/peer"
    "encoding/json"
	"time"
)
// logger
var logger = shim.NewLogger("record0")
// 记录状态
const (
	RecordInfo_State_WaitForSign = "WaitForSign"
	RecordInfo_State_Signed = "Signed"
	RecordInfo_State_Reject = "Reject"
	OrgChange_State_NotRequire = "NotRequire"
	OrgChange_State_WaitForTransfer = "WaitForTransfer"
	OrgChange_State_Accept = "Accepted"
	OrgChange_State_Reject = "Rejected"
)
// 记录key的前缀
const Record_Prefix = "Record_"

// search表映射名
const (
	// 医生对自己所开的表的查询
	SearchMyRecordIndexName = "ONAME-DPIN~RID"
	// 护士对自己需要签字的表的查询
	SearchSignIndexName = "ONAME-DSPIN~RID"
	// 生成本组织的查询
	SearchAllIndexName = "ONAME~RID"
	// 病人所有的历史记录查询
	SearchPatiantIndexName = "PID~RID"
	// 被转院查询
	SearchBeTransferedIndexName = "OTNAM-DSPIN~ONAME-RID"
	// 转院查询
	SearchTransferIndexName = "ONAME-PDPT~OTNAM-RID"
)
//时间格式
const timeFormatwithTime = "20060102150405"
const timeFormatwithOutTime = "2006-01-02"
// 记录结构体
type Record struct {
	//医生
	Dname string `json:"D_name"`				//医生名称
	Dpin string `json:"D_pin"`					//医生工号
	Dsnam string `json:"D_snam"`				//签名护士名称
	Dspin string `json:"D_spin"`				//签名护士工号
	Dsigs string `json:"D_sigs"`				//签名状态
	Dresn string `json:"D_resn"`				//拒签原因
	//病人
	Pname string `json:"P_name"`                //病人姓名
	Psex string `json:"P_sex"`              	//病人性别
	Page int `json:"P_age"`            		    //病人年龄
	Pnat string `json:"P_nat"`    				//病人民族
	Ptel string `json:"P_tel"`    				//病人电话
	Padd string `json:"P_add"`					//病人住址
	Pocc string `json:"P_occ"`					//病人职业
	Pdpt string `json:"P_dpt"`         			//病人科室
	Pdgn string `json:"P_dgn"`					//病人诊断
	Pbih bool `json:"P_bih"`					//病人是否住院
	Pid string `json:"P_id"`					//病人身份证号
	Pbthplace string `json:"P_bthplace"`        //病人出生地
	Pmarstate string `json:"P_marstate"`        //病人婚姻状况
	Pward string `json:"P_ward"`					//住院病房
	//不良嗜好
	Psmoke bool `json:"P_smoke"`               	//抽烟
	Palchl bool `json:"P_alchl"`        		//酗酒
	//亲属
	RSname string `json:"RS_name"`				//病人亲属姓名
	RSrels string `json:"RS_rels"`				//病人亲属关系
	RStel string `json:"RS_tel"`				//病人亲属电话
	//病史
	Rid string `json:"R_id"`					//记录id
	Rinday string `json:"R_inday"`				//记录日期
	Routday string `json:"R_outday"`			//签字日期
	Ranplcg string `json:"R_anplcg"`        	//过敏原
	Rindish string `json:"R_indish"`    		//感染病史
	Rgtdish string `json:"R_gtdish"`    		//遗传病史
	//院区
	Oname string `json:"O_name"`				//所在院区
	Oith bool `json:"O_ith"`                    //是否转院
	Oqtd string `json:"O_qtd"`					//转院发起时间
	Oatd string `json:"O_atd"`					//接受转院时间
	Otnam string `json:"O_tnam"`				//所转院区
	Oadpn string `json:"O_adpn"`				//接受医生工号
	Oadnm string `json:"O_adnm"`				//接受医生姓名
	Ostate string `json:"O_state"`				//转院状态
	Oresn string `json:"O_resn"`				//拒绝原因
	//历史
	Rhis []Record `json:"R_his"`       		 	//签字历史
}

// chaincode response结构
type chaincodeRet struct {
    Code int // 0 success otherwise 1
    Des  string //description
}
// chaincode
type RecordChaincode struct {
}

// 链码方法
// chaincode Init 接口
func (a *RecordChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}
// chaincode Invoke 接口
func (a *RecordChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
    logger.Info("########### Invoke ###########")
    function,args := stub.GetFunctionAndParameters()
	logger.Info("%s%s","function=",function)
	logger.Infof("%s%s","args=",args)

    // invoke
    if function == "issue" {
        return a.issue(stub, args)
    } else if function == "updateRecd" {
		return a.updateRecd(stub, args)
	} else if function == "requireTrans" {
        return a.requireTrans(stub, args)
    } else if function == "acceptSign" {
        return a.acceptSign(stub, args)
    } else if function == "rejectSign" {
        return a.rejectSign(stub, args)
    } else if function == "acceptTrans" {
        return a.acceptTrans(stub, args)
    } else if function == "rejectTrans" {
        return a.rejectTrans(stub, args)
	}
	
	// query
	if function == "queryMyRecord" {
		return a.queryMyRecord(stub, args)
	} else if function == "queryByRid" {
		return a.queryByRid(stub, args)
	} else if function == "querySignRecord" {
		return a.querySignRecord(stub, args)
	} else if function == "queryTransferRecord" {
		return a.queryTransferRecord(stub, args)
	} else if function == "queryBeTransferedRecord" {
		return a.queryBeTransferedRecord(stub, args)
	} else if function == "queryRecord" {
		return a.queryRecord(stub, args)
	} else if function == "queryByPid" {
		return a.queryByPid(stub, args)
	} 

    logger.Errorf("Unknown action %v", args[0])
	return shim.Error(fmt.Sprintf("Unknown action, check the first argument %v", args[0]))
}
// 工具函数
// 获取当前时间
func getCurtTime (tf string) string{
	local,_ := time.LoadLocation("Local") 
	return time.Now().In(local).Format(tf)
}

// 回执信息转换
func getRetByte(code int,des string) []byte {
    var r chaincodeRet
    r.Code = code
    r.Des = des

    b,err := json.Marshal(r)

    if err!=nil {
        fmt.Println("marshal Ret failed")
        return nil
    }
    return b
}
// 回执信息转换
func getRetString(code int,des string) string {
    var r chaincodeRet
    r.Code = code
    r.Des = des

    b,err := json.Marshal(r)

    if err!=nil {
        fmt.Println("marshal Ret failed")
        return ""
    }
	logger.Infof("%s",string(b[:]))
    return string(b[:])
}
// 根据记录编号取出记录
func (a *RecordChaincode) getRecord(stub shim.ChaincodeStubInterface,Rid string) (Record, bool) {
	var record Record
	key := Record_Prefix + Rid
	b,err := stub.GetState(key)
	if b==nil {
		return record, false
	}
	err = json.Unmarshal(b,&record)
	if err!=nil {
		return record, false
	}
	return record, true
}
// 保存记录
func (a *RecordChaincode) putRecord(stub shim.ChaincodeStubInterface, record Record) ([]byte, bool) {

	byte,err := json.Marshal(record)
	if err!=nil {
		return nil, false
	}

	err = stub.PutState(Record_Prefix + record.Rid, byte)
	if err!=nil {
		return nil, false
	}
	return byte, true
}
// 区块链函数
// 病历发布
// args[0] - Record Obj
func (a *RecordChaincode) issue(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// 传入参数校验
	if len(args)!=1 {
		res := getRetString(1,"Invoke issue args!=1")
		return shim.Error(res)
	}
	// 将传入JSON字符数据转换成结构体
	var record Record
	fmt.Println("record"+args[0])
	err := json.Unmarshal([]byte(args[0]), &record)
	if err!=nil {
		// res := getRetString(1,"Invoke issue unmarshal failed")
		fmt.Println(fmt.Sprintf("recieve error: %s", err))
		return shim.Error(fmt.Sprintf("recieve error: %s", err))
	}
	// 生成病历ID与问诊日期
	record.Rid = record.Pid+"/"+getCurtTime(timeFormatwithTime)
	record.Rinday = getCurtTime(timeFormatwithOutTime)
	// 更改记录信息和状态并保存记录:记录状态设为等待签字,转院状态设为不请求
	record.Dsigs = RecordInfo_State_WaitForSign
	record.Ostate = OrgChange_State_NotRequire
    // 保存记录
	_, bl := a.putRecord(stub, record)
	if !bl {
		res := getRetString(1,"Invoke issue put record failed")
		return shim.Error(res)
	}
	// 以生成记录医生ID、组织名、记录号构造复合key 向search表中保存 value为空即可 以便医生批量查询
	SearchMyRecordIndexKey, err := stub.CreateCompositeKey(SearchMyRecordIndexName, []string{record.Oname, record.Dpin, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke issue put search table failed")
		return shim.Error(res)
	}
	// 以待签字护士ID、组织名、记录号构造复合key 向search表中保存 value为空即可 以便待签字人批量查询
	SearchSignIndexKey, err := stub.CreateCompositeKey(SearchSignIndexName, []string{record.Oname, record.Dspin, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke issue put search table failed")
		return shim.Error(res)
	}
	// 根据病人ID与病历号作为复合主键，向Search表中保存，以便查询历史记录
	SearchPatiantIndexKey, err := stub.CreateCompositeKey(SearchPatiantIndexName, []string{record.Pid, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke issue put search table failed")
		return shim.Error(res)
	}
	// 根据组织名病历号作为复合主键，向Search表中保存，以便查询历史记录
	SearchAllIndexKey, err := stub.CreateCompositeKey(SearchAllIndexName, []string{record.Oname, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke issue put search table failed")
		return shim.Error(res)
	}
	// 获取历史记录并存入当前对象中
	// 写入数据库
	stub.PutState(SearchMyRecordIndexKey, []byte{0x00})
	stub.PutState(SearchSignIndexKey, []byte{0x00})
	stub.PutState(SearchPatiantIndexKey, []byte{0x00})
	stub.PutState(SearchAllIndexKey, []byte{0x00})
	res := getRetByte(0,"invoke issue success")
	return shim.Success(res)
}
// 签字人更新病历信息
// args: 0 - Record Obj
func (a *RecordChaincode) updateRecd(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// 传入参数校验
	if len(args) !=1 {
		res := getRetString(1,"updateRecord updateRecd args!=1,but " + strconv.Itoa(len(args)))
		return shim.Error(res)
	}
	// 将传入JSON字符数据转换成结构体
	var record Record
	err := json.Unmarshal([]byte(args[0]), &record)
	if err!=nil {
		// res := getRetString(1,"Invoke issue unmarshal failed")
		fmt.Println(fmt.Sprintf("recieve error: %s", err))
		return shim.Error(fmt.Sprintf("recieve error: %s", err))
	}
	// 屏蔽非待签字记录的更新请求
	if record.Dsigs != RecordInfo_State_WaitForSign{
		res := getRetString(1,"Couldnt updateRecd a Signed Record")
		return shim.Error(res)
	} 

    // 保存记录
	_, bl := a.putRecord(stub, record)
	if !bl {
		res := getRetString(1,"updateRecord put record failed")
		return shim.Error(res)
	}

	res := getRetByte(0,"updateRecd success")
	return shim.Success(res)
}
// 转院请求
// args: 0 - Record Obj 
func (a *RecordChaincode) requireTrans(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// 传入参数校验
	if len(args)!=1 {
		res := getRetString(1,"updateRecord requireTrans args!=1")
		return shim.Error(res)
	}
	// 将传入JSON字符数据转换成结构体
	var record Record
	err := json.Unmarshal([]byte(args[0]), &record)
	if err!=nil {
		// res := getRetString(1,"Invoke issue unmarshal failed")
		fmt.Println(fmt.Sprintf("recieve error: %s", err))
		return shim.Error(fmt.Sprintf("recieve error: %s", err))
	}
	// 屏蔽非待签字记录的更新请求
	if record.Dsigs != RecordInfo_State_WaitForSign{
		res := getRetString(1,"Couldnt Update a Signed Record")
		return shim.Error(res)
	} 
	// 修改转院状态
	record.Ostate = OrgChange_State_WaitForTransfer
	record.Oqtd = getCurtTime(timeFormatwithOutTime)
    // 保存记录
	_, bl := a.putRecord(stub, record)
	if !bl {
		res := getRetString(1,"requireTrans put record failed")
		return shim.Error(res)
	}
	// 以待签字护士ID、组织名、记录号构造复合key 向search表中保存 value为空即可 以便待签字人批量查询
	SearchSignIndexKey, err := stub.CreateCompositeKey(SearchSignIndexName, []string{record.Oname, record.Dspin, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke issue put search table failed")
		return shim.Error(res)
	}
	// 以生成当前院名、转院名、记录号构造复合key 向search表中保存 value为空即可 以便医生批量查询
	SearchTransferIndexKey, err := stub.CreateCompositeKey(SearchTransferIndexName, []string{record.Oname, record.Dspin, record.Otnam, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke requireTrans put search table failed")
		return shim.Error(res)
	}
	// 以生成转院名、当前院名、记录号构造复合key 向search表中保存 value为空即可 以便医生批量查询
	SearchBeTransferedIndexKey, err := stub.CreateCompositeKey(SearchBeTransferedIndexName, []string{record.Otnam, record.Pdpt, record.Oname, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke requireTrans put search table failed")
		return shim.Error(res)
	}
	stub.DelState(SearchSignIndexKey)
	stub.PutState(SearchTransferIndexKey, []byte{0x00})
	stub.PutState(SearchBeTransferedIndexKey, []byte{0x00})
	res := getRetByte(0,"requireTrans success")
	return shim.Success(res)
}
// 签字人接受签字
// args: 0 - Record Obj
func (a *RecordChaincode) acceptSign(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// 输入参数检验
	if len(args) != 1 {
		res := getRetString(1,"Invoke acceptSign args != 1")
		return shim.Error(res)
	}
	// 将传入JSON字符数据转换成结构体
	var record Record
	err := json.Unmarshal([]byte(args[0]), &record)
	if err!=nil {
		// res := getRetString(1,"Invoke issue unmarshal failed")
		fmt.Println(fmt.Sprintf("recieve error: %s", err))
		return shim.Error(fmt.Sprintf("recieve error: %s", err))
	}
	record.Dsigs = RecordInfo_State_Signed
	record.Routday = getCurtTime(timeFormatwithOutTime)
	record.Pward = ""
    // 保存记录
	_, bl := a.putRecord(stub, record)
	if !bl {
		res := getRetString(1,"Invoke acceptSign put record failed")
		return shim.Error(res)
	}
	// 以待签字护士ID、组织名、记录号构造复合key 向search表中保存 value为空即可 以便待签字人批量查询
	SearchSignIndexKey, err := stub.CreateCompositeKey(SearchSignIndexName, []string{record.Oname, record.Dspin, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke acceptSign put search table failed")
		return shim.Error(res)
	}
	// 删除签字生成的查询
	stub.DelState(SearchSignIndexKey)
	res := getRetByte(0,"invoke acceptSign success")
	return shim.Success(res)
}
// 签字人拒绝签字
// args: 0 - Record Obj
func (a *RecordChaincode) rejectSign(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args)!=1 {
		res := getRetString(1,"Invoke rejectSign args!=1")
		return shim.Error(res)
	}
    // 将传入JSON字符数据转换成结构体
	var record Record
	err := json.Unmarshal([]byte(args[0]), &record)
	if err!=nil {
		// res := getRetString(1,"Invoke issue unmarshal failed")
		fmt.Println(fmt.Sprintf("recieve error: %s", err))
		return shim.Error(fmt.Sprintf("recieve error: %s", err))
	}
	// 更改记录信息和状态并保存记录: 将拒绝签字人改为当前签字人，重置待签字人,记录状态改为签字拒绝
	record.Dsigs = RecordInfo_State_Reject
    // 保存记录
	_, bl := a.putRecord(stub, record)
	if !bl {
		res := getRetString(1,"Invoke rejectSign put record failed")
		return shim.Error(res)
	}
	// 以当前签字人ID和票号构造复合key 从search表中删除该key 以便当前签字人无法再查到该记录
	SearchSignIndexKey, err := stub.CreateCompositeKey(SearchSignIndexName, []string{record.Oname, record.Dspin, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke rejectSign put search table failed")
		return shim.Error(res)
	}
	stub.DelState(SearchSignIndexKey)
	
	res := getRetByte(0,"invoke rejectSign success")
	return shim.Success(res)
}
// 接受转院请求并分配医生与护士
// args: 0 - Record Obj
func (a *RecordChaincode) acceptTrans(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args)!=1 {
		res := getRetString(1,"Invoke acceptTrans args!=1")
		return shim.Error(res)
	}
    // 将传入JSON字符数据转换成结构体
	var record Record
	fmt.Println("record"+args[0])
	err := json.Unmarshal([]byte(args[0]), &record)
	if err!=nil {
		// res := getRetString(1,"Invoke issue unmarshal failed")
		fmt.Println(fmt.Sprintf("recieve error: %s", err))
		return shim.Error(fmt.Sprintf("recieve error: %s", err))
	}
	// 以生成当前院名、转院名、记录号构造复合key 向search表中保存 value为空即可 以便医生批量查询
	SearchTransferIndexKey, err := stub.CreateCompositeKey(SearchTransferIndexName, []string{record.Oname, record.Dspin, record.Otnam, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke acceptTrans put search table failed")
		return shim.Error(res)
	}
	// 以生成转院名、当前院名、记录号构造复合key 向search表中保存 value为空即可 以便医生批量查询
	SearchBeTransferedIndexKey, err := stub.CreateCompositeKey(SearchBeTransferedIndexName, []string{record.Otnam, record.Pdpt, record.Oname, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke acceptTrans put search table failed")
		return shim.Error(res)
	}
	// 以待签字护士ID、组织名、记录号构造复合key 向search表中保存 value为空即可 以便待签字人批量查询
	SearchSignIndexKey, err := stub.CreateCompositeKey(SearchSignIndexName, []string{record.Dspin, record.Oname, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke acceptTrans put search table failed")
		return shim.Error(res)
	}
	// 删除原有医院生成的查询
	stub.DelState(SearchTransferIndexKey)
	stub.DelState(SearchBeTransferedIndexKey)
	stub.DelState(SearchSignIndexKey)
	// 更新记录
	record.Ostate = OrgChange_State_Accept
	record.Oname = record.Otnam
	record.Otnam = ""
	record.Oatd = getCurtTime(timeFormatwithOutTime)
    // 保存记录
	_, bl := a.putRecord(stub, record)
	if !bl {
		res := getRetString(1,"Invoke acceptTrans put record failed")
		return shim.Error(res)
	}
	// 以生成记录医生ID、组织名、记录号构造复合key 向search表中保存 value为空即可 以便医生批量查询
	SearchMyRecordIndexKey, err1 := stub.CreateCompositeKey(SearchMyRecordIndexName, []string{record.Oname, record.Dpin, record.Rid})
	if err1 != nil {
		res := getRetString(1,"Invoke acceptTrans put search table failed")
		return shim.Error(res)
	}
	// 以待签字护士ID、组织名、记录号构造复合key 向search表中保存 value为空即可 以便待签字人批量查询
	SearchSignIndexKey, err2 := stub.CreateCompositeKey(SearchSignIndexName, []string{record.Oname, record.Dspin, record.Rid})
	if err2 != nil {
		res := getRetString(1,"Invoke acceptTrans put search table failed")
		return shim.Error(res)
	}
	// 根据组织名病历号作为复合主键，向Search表中保存，以便查询历史记录
	SearchAllIndexKey, err := stub.CreateCompositeKey(SearchAllIndexName, []string{record.Oname, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke acceptTrans put search table failed")
		return shim.Error(res)
	}
	// 生成新医院的查询记录
	stub.PutState(SearchMyRecordIndexKey, []byte{0x00})
	stub.PutState(SearchSignIndexKey, []byte{0x00})
	stub.PutState(SearchAllIndexKey, []byte{0x00})
	res := getRetByte(0,"invoke acceptTrans success")
	return shim.Success(res)
}
// 拒绝转院
// args: 0 - Record Obj
func (a *RecordChaincode) rejectTrans(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args)!=1 {
		res := getRetString(1,"Invoke rejectTrans args!=1")
		return shim.Error(res)
	}
    // 将传入JSON字符数据转换成结构体
	var record Record
	fmt.Println("record"+args[0])
	err := json.Unmarshal([]byte(args[0]), &record)
	if err!=nil {
		// res := getRetString(1,"Invoke issue unmarshal failed")
		fmt.Println(fmt.Sprintf("recieve error: %s", err))
		return shim.Error(fmt.Sprintf("recieve error: %s", err))
	}
	// 更新记录
	record.Dsigs = OrgChange_State_Reject
    // 保存记录
	_, bl := a.putRecord(stub, record)
	if !bl {
		res := getRetString(1,"Invoke rejectTrans put record failed")
		return shim.Error(res)
	}
	// 以生成转院名、当前院名、记录号构造复合key 向search表中保存 value为空即可 以便医生批量查询
	SearchBeTransferedIndexKey, err := stub.CreateCompositeKey(SearchBeTransferedIndexName, []string{record.Otnam, record.Pdpt, record.Oname, record.Rid})
	if err != nil {
		res := getRetString(1,"Invoke rejectTrans put search table failed")
		return shim.Error(res)
	}
	stub.DelState(SearchBeTransferedIndexKey)
	res := getRetByte(0,"invoke rejectTrans success")
	return shim.Success(res)
}
// 查询医生的记录:根据编号 批量查询记录
//  0 - Oname; 1 - Dpin;
func (a *RecordChaincode) queryMyRecord(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args)!=2 {
		res := getRetString(1,"queryMyRecord args!=2")
		return shim.Error(res)
	}
	// 以ID从search表中批量查询所持有的票号
	recordsIterator, err := stub.GetStateByPartialCompositeKey(SearchMyRecordIndexName, []string{args[0], args[1]})
	if err != nil {
		res := getRetString(1,"queryMyRecord get record list error")
		return shim.Error(res)
	}
	defer recordsIterator.Close()
	// 定义列表
	var recordList = []Record{}
	for recordsIterator.HasNext() {
		kv, _ := recordsIterator.Next()
		// 取得持票人名下的票号
		_, compositeKeyParts, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			res := getRetString(1,"queryMyRecord SplitCompositeKey error")
			return shim.Error(res)
		}
        // 根据票号取得记录
		record, bl := a.getRecord(stub, compositeKeyParts[2])
		if !bl {
			res := getRetString(1,"queryMyRecord get record error")
			return shim.Error(res)
		}
		recordList = append(recordList, record)
	}
	// 取得并返回记录数组 
	b,_ := json.Marshal(recordList)
	return shim.Success(b)
}
// 查询护士的待签字记录: 根据签字人编号 批量查询记录
//  0 - Oname; 1 - Dspn;
func (a *RecordChaincode) querySignRecord(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args)!=2 {
		res := getRetString(1,"querySignRecord args!=2")
		return shim.Error(res)
	}
    // 以签字人ID从search表中批量查询所持有的票号
	recordsIterator, err := stub.GetStateByPartialCompositeKey(SearchSignIndexName, []string{args[0],args[1]})
	if err != nil {
		res := getRetString(1,"querySignRecord GetStateByPartialCompositeKey error")
		return shim.Error(res)
	}
	defer recordsIterator.Close()

	var recordList = []Record{}

	for recordsIterator.HasNext() {
		kv, _ := recordsIterator.Next()
		// 从search表中批量查询与签字人有关的票号
		_, compositeKeyParts, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			res := getRetString(1,"querySignRecord SplitCompositeKey error")
			return shim.Error(res)
		}
        // 根据票号取得记录
		record, bl := a.getRecord(stub, compositeKeyParts[2])
		if !bl {
			res := getRetString(1,"querySignRecord get record error")
			return shim.Error(res)
		}
		// 取得状态为待签字的记录 并且待签字人是当前签字人
		if record.Dsigs == RecordInfo_State_WaitForSign && record.Dspin == args[1] {
			recordList = append(recordList, record)
		}
	}
    // 取得并返回记录数组 
	b, err := json.Marshal(recordList)
	if err != nil {
		res := getRetString(1,"Marshal querySignRecord recordList error")
		return shim.Error(res)
	}
	logger.Infof("test1:%s",b)
	return shim.Success(b)
}
// 根据记录号取得记录 以及该记录病人历史记录
//  0 - Rid;
func (a *RecordChaincode) queryByRid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// 输入参数校验
	if len(args)!=1 {
		res := getRetString(1,"queryByRid args!=1")
		return shim.Error(res)
	}
    // 取得该记录
	record, bl := a.getRecord(stub, args[0])
	if !bl {
		res := getRetString(1,"queryByRid get record error")
		return shim.Error(res)
	}

	// 取得病人历史记录:
	resultsIterator, err := stub.GetStateByPartialCompositeKey(SearchPatiantIndexName,[]string{record.Pid})
	if err != nil {
		res := getRetString(1,"queryByRid GetHistoryForKey error")
		return shim.Error(res)
	}
	defer resultsIterator.Close()

	var hisRecord []Record
	for resultsIterator.HasNext() {
		kv, _ := resultsIterator.Next()
		// 从search表中批量查询与签字人有关的票号
		_, compositeKeyParts, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			res := getRetString(1,"queryByRid SplitCompositeKey error")
			return shim.Error(res)
		}
		// 根据票号取得记录
		if record.Rid != compositeKeyParts[1] {
			recordget, bl := a.getRecord(stub, compositeKeyParts[1])
			if !bl {
				res := getRetString(1,"queryByRid get record error")
				return shim.Error(res)
			}
			hisRecord = append(hisRecord, recordget) 
		}
	}
	// 将签字历史做为记录的一个属性 一同返回
	record.Rhis = hisRecord

	b, err := json.Marshal(record)
	if err != nil {
		res := getRetString(1,"Marshal queryByRid recordList error")
		return shim.Error(res)
	}
	return shim.Success(b)
}

// 根据组织名与问诊科室查询
//  0 - Oname; 1 - Dspin
func (a *RecordChaincode) queryTransferRecord(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// 输入参数校验
	if len(args)!=2 {
		res := getRetString(1,"queryTransferRecord args!=2")
		return shim.Error(res)
	}
    recordsIterator, err := stub.GetStateByPartialCompositeKey(SearchTransferIndexName, []string{args[0],args[1]})
	if err != nil {
		res := getRetString(1,"queryTransferRecord GetStateByPartialCompositeKey error")
		return shim.Error(res)
	}
	defer recordsIterator.Close()

	var recordList = []Record{}

	for recordsIterator.HasNext() {
		kv, _ := recordsIterator.Next()
		// 从search表中批量查询与签字人有关的票号
		_, compositeKeyParts, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			res := getRetString(1,"queryTransferRecord SplitCompositeKey error")
			return shim.Error(res)
		}
        // 根据票号取得记录
		record, bl := a.getRecord(stub, compositeKeyParts[3])
		if !bl {
			res := getRetString(1,"queryTransferRecord get record error")
			return shim.Error(res)
		}
		recordList = append(recordList, record)
	}
	b, err := json.Marshal(recordList)
	if err != nil {
		res := getRetString(1,"Marshal queryTransferRecord recordList error")
		return shim.Error(res)
	}
	return shim.Success(b)
}
// 根据记录号取得记录 以及该记录病人历史记录
//  0 - Oname; 1 - Pdpt
func (a *RecordChaincode) queryBeTransferedRecord(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// 输入参数校验
	if len(args)!=2 {
		res := getRetString(1,"queryBeTransferedRecord args!=2")
		return shim.Error(res)
	}
    recordsIterator, err := stub.GetStateByPartialCompositeKey(SearchBeTransferedIndexName, []string{args[0],args[1]})
	if err != nil {
		res := getRetString(1,"queryBeTransferedRecord GetStateByPartialCompositeKey error")
		return shim.Error(res)
	}
	defer recordsIterator.Close()

	var recordList = []Record{}

	for recordsIterator.HasNext() {
		kv, _ := recordsIterator.Next()
		// 从search表中批量查询与签字人有关的票号
		_, compositeKeyParts, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			res := getRetString(1,"queryBeTransferedRecord SplitCompositeKey error")
			return shim.Error(res)
		}
        // 根据票号取得记录
		record, bl := a.getRecord(stub, compositeKeyParts[3])
		if !bl {
			res := getRetString(1,"queryBeTransferedRecord get record error")
			return shim.Error(res)
		}
		recordList = append(recordList, record)
	}
	b, err := json.Marshal(recordList)
	if err != nil {
		res := getRetString(1,"Marshal queryBeTransferedRecord recordList error")
		return shim.Error(res)
	}
	return shim.Success(b)
}
// 返回所有记录并提供所有记录的修改历史(管理员方法)
//  0 - Oname;
func (a *RecordChaincode) queryRecord(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// 输入参数校验
	if len(args)!=1 {
		res := getRetString(1,"queryRecord args!=1")
		return shim.Error(res)
	}
	// 取得病人历史记录:
	resultsIterator, err := stub.GetStateByPartialCompositeKey(SearchAllIndexName,[]string{args[0]})
	if err != nil {
		res := getRetString(1,"queryRecord GetHistoryForKey error")
		return shim.Error(res)
	}
	defer resultsIterator.Close()

	var recordList []Record
	for resultsIterator.HasNext() {
		kv, _ := resultsIterator.Next()
		// 从search表中批量查询与签字人有关的票号
		_, compositeKeyParts, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			res := getRetString(1,"queryRecord SplitCompositeKey error")
			return shim.Error(res)
		}
        // 根据票号取得记录
		record, bl := a.getRecord(stub, compositeKeyParts[1])
		if !bl {
			res := getRetString(1,"queryRecord get record error")
			return shim.Error(res)
		}
		recordIterator, err := stub.GetHistoryForKey(Record_Prefix+compositeKeyParts[1])
		if err != nil {
			res := getRetString(1,"queryRecord GetHistoryForKey error")
			return shim.Error(res)
		}
		defer recordIterator.Close()
		var hisRecordList []Record
		var hisRecord Record
		for recordIterator.HasNext(){
			hisRecordData, err := recordIterator.Next()
			if err != nil {
				res := getRetString(1,"resultsIterator.Next() error")
				return shim.Error(res)
			}
			json.Unmarshal(hisRecordData.Value, &hisRecord)
			hisRecordList = append(hisRecordList,hisRecord)
		}
		record.Rhis = hisRecordList
		recordList = append(recordList, record) //add this tx to the list
	}
	// 将记录列表 一同返回
	b, err := json.Marshal(recordList)
	if err != nil {
		res := getRetString(1,"Marshal queryRecord recordList error")
		return shim.Error(res)
	}
	return shim.Success(b)
}
// 根据记录号取得记录 以及该记录病人历史记录
//  0 - Pid;
func (a *RecordChaincode) queryByPid(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// 输入参数校验
	if len(args)!=1 {
		res := getRetString(1,"queryByPid args!=1")
		return shim.Error(res)
	}
	// 取得病人历史记录:
	resultsIterator, err := stub.GetStateByPartialCompositeKey(SearchPatiantIndexName,[]string{args[0]})
	if err != nil {
		res := getRetString(1,"queryByPid GetHistoryForKey error")
		return shim.Error(res)
	}
	defer resultsIterator.Close()
	var record Record
	for resultsIterator.HasNext() {
		kv, _ := resultsIterator.Next()
		_, compositeKeyParts, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
		res := getRetString(1,"queryByPid SplitCompositeKey error")
			return shim.Error(res)
		}
		record.Rid = compositeKeyParts[1]
	}
	// 根据票号取得记录
	record, bl := a.getRecord(stub, record.Rid)
	if !bl {
		res := getRetString(1,"queryByPid get record error")
		return shim.Error(res)
	}
	b, err := json.Marshal(record)
	if err != nil {
		res := getRetString(1,"Marshal queryByPid recordList error")
		return shim.Error(res)
	}
	return shim.Success(b)
}
// 主方法
func main() {
    if err := shim.Start(new(RecordChaincode)); err != nil {
        fmt.Printf("Error starting Record Chaincode: %s", err)
    }
}

