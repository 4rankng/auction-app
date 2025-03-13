import tkinter as tk
from tkinter import ttk, messagebox
from tkinter import font as tkfont
import locale
import sys
from datetime import datetime
import pandas as pd
from tkinter import filedialog

# Set up locale for currency formatting
locale.setlocale(locale.LC_ALL, '')

def format_currency(amount):
    """Format number as currency with dot as thousand separator"""
    try:
        return f"{amount:,.0f} đồng".replace(',', '.')
    except:
        return f"{amount:,.0f} đồng".replace(',', '.')

def center_window(window):
    """Center a tkinter window on the screen"""
    window.update_idletasks()
    width = window.winfo_width()
    height = window.winfo_height()
    x = (window.winfo_screenwidth() // 2) - (width // 2)
    y = (window.winfo_screenheight() // 2) - (height // 2)
    window.geometry(f'{width}x{height}+{x}+{y}')

def setup_styles():
    """Set up custom styles for the application"""
    style = ttk.Style()

    # Cấu hình font chữ mặc định cho toàn bộ ứng dụng
    default_font = ('Helvetica', 10)
    style.configure('.', font=default_font)

    # Cấu hình các style chính
    style.configure('Header.TLabel', font=('Helvetica', 12, 'bold'))
    style.configure('Currency.TLabel', font=('Helvetica', 10))
    style.configure('Success.TLabel', foreground='green', font=('Helvetica', 10))
    style.configure('Error.TLabel', foreground='red', font=('Helvetica', 10))
    style.configure('Bold.TButton', font=('Helvetica', 10, 'bold'))

    # Cấu hình Treeview
    style.configure('Treeview', rowheight=25, font=('Helvetica', 10))
    style.configure('Treeview.Heading', font=('Helvetica', 10, 'bold'))

    # Cấu hình LabelFrame
    style.configure('TLabelframe', font=('Helvetica', 10))
    style.configure('TLabelframe.Label', font=('Helvetica', 10, 'bold'))

    # Cấu hình Entry và Spinbox
    style.configure('TEntry', font=('Helvetica', 10))
    style.configure('TSpinbox', font=('Helvetica', 10))
    style.configure('TCombobox', font=('Helvetica', 10))

class ThongTinDauGia:
    def __init__(self, master, tai_san, gia_khoi_diem, buoc_gia, dau_gia_vien):
        self.window = tk.Toplevel(master)
        self.window.title("Thông Tin Đấu Giá")
        self.window.state('zoomed')  # Maximize cửa sổ
        
        # Lưu thông tin tài sản và đấu giá viên
        self.tai_san = tai_san
        self.dau_gia_vien = dau_gia_vien
        
        # Thiết lập font chữ lớn cho màn hình thông tin
        self.title_font = ('Helvetica', 28, 'bold')
        self.header_font = ('Helvetica', 24, 'bold')
        self.info_font = ('Helvetica', 22)
        self.timer_font = ('Helvetica', 72, 'bold')
        
        # Main frame
        main_frame = ttk.Frame(self.window, padding="30")
        main_frame.grid(row=0, column=0, sticky="nsew")
        self.window.columnconfigure(0, weight=1)
        self.window.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        
        # Tạo frame cho tiêu đề công ty
        title_frame = ttk.Frame(main_frame)
        title_frame.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        title_frame.columnconfigure(0, weight=1)
        
        title_text = tk.Text(title_frame, font=self.title_font, height=1, wrap=tk.WORD,
                           background=self.window.cget('background'), relief='flat',
                           highlightthickness=0, width=60)
        title_text.grid(row=0, column=0, sticky="nsew")
        title_text.insert('1.0', "CÔNG TY ĐẤU GIÁ HỢP DANH HP.AUSERCO")
        title_text.configure(state='disabled')
        title_text.tag_configure('center', justify='center')
        title_text.tag_add('center', '1.0', 'end')
        
        # Tạo frame cho phần tài sản
        tai_san_frame = ttk.Frame(main_frame)
        tai_san_frame.grid(row=1, column=0, columnspan=2, pady=(0, 10))
        tai_san_frame.columnconfigure(0, weight=1)
        
        # Label "Phiên đấu giá tài sản"
        phien_text = tk.Text(tai_san_frame, font=self.header_font, height=1, wrap=tk.WORD,
                           background=self.window.cget('background'), relief='flat',
                           highlightthickness=0, width=60)
        phien_text.grid(row=0, column=0, pady=(0, 10))
        phien_text.insert('1.0', "Phiên đấu giá tài sản:")
        phien_text.configure(state='disabled')
        phien_text.tag_configure('center', justify='center')
        phien_text.tag_add('center', '1.0', 'end')
        
        # Text widget cho tài sản
        tai_san_text = tk.Text(tai_san_frame, font=('Helvetica', 24), height=2, wrap=tk.WORD,
                             background=self.window.cget('background'), relief='flat',
                             highlightthickness=0, width=120)
        tai_san_text.grid(row=1, column=0, sticky="nsew")
        tai_san_text.insert('1.0', tai_san)
        tai_san_text.configure(state='disabled')
        tai_san_text.tag_configure('center', justify='center')
        tai_san_text.tag_add('center', '1.0', 'end')
        
        # Frame cho đấu giá viên
        dau_gia_vien_frame = ttk.Frame(main_frame)
        dau_gia_vien_frame.grid(row=2, column=0, columnspan=2, pady=(0, 20))
        dau_gia_vien_frame.columnconfigure(0, weight=1)
        
        dau_gia_vien_text = tk.Text(dau_gia_vien_frame, font=('Helvetica', 24, 'bold'), height=1, wrap=tk.WORD,
                                   background=self.window.cget('background'), relief='flat',
                                   highlightthickness=0, width=80)
        dau_gia_vien_text.grid(row=0, column=0, sticky="nsew")
        dau_gia_vien_text.insert('1.0', f"Đấu giá viên: {dau_gia_vien}")
        dau_gia_vien_text.configure(state='disabled')
        dau_gia_vien_text.tag_configure('center', justify='center')
        dau_gia_vien_text.tag_add('center', '1.0', 'end')
        
        # Frame cho thông tin giá - Bên trái
        info_frame = ttk.Frame(main_frame)
        info_frame.grid(row=3, column=0, sticky="nsew", padx=20, pady=10)
        info_frame.columnconfigure(0, weight=1)
        
        # Text widget cho giá khởi điểm
        gia_khoi_diem_text = tk.Text(info_frame, font=self.info_font, height=1, wrap=tk.WORD,
                                    background=self.window.cget('background'), relief='flat',
                                    highlightthickness=0, width=40)
        gia_khoi_diem_text.grid(row=0, column=0, sticky="w", pady=10)
        gia_khoi_diem_text.insert('1.0', f"Giá khởi điểm: {format_currency(gia_khoi_diem)}")
        gia_khoi_diem_text.configure(state='disabled')
        self.lbl_gia_khoi_diem = gia_khoi_diem_text
        
        # Text widget cho bước giá
        buoc_gia_text = tk.Text(info_frame, font=self.info_font, height=1, wrap=tk.WORD,
                               background=self.window.cget('background'), relief='flat',
                               highlightthickness=0, width=40)
        buoc_gia_text.grid(row=1, column=0, sticky="w", pady=10)
        buoc_gia_text.insert('1.0', f"Bước giá: {format_currency(buoc_gia)}")
        buoc_gia_text.configure(state='disabled')
        self.lbl_buoc_gia = buoc_gia_text
        
        # Frame cho lịch sử trả giá - Bên phải
        self.lich_su_frame = ttk.LabelFrame(main_frame, text="Lịch sử trả giá gần nhất", padding=15)
        self.lich_su_frame.grid(row=3, column=1, sticky="nsew", padx=20, pady=10)
        self.lich_su_frame.grid_remove()
        self.lich_su_frame.columnconfigure(0, weight=1)
        
        # Text widgets cho lịch sử
        self.lbl_lich_su_1 = tk.Text(self.lich_su_frame, font=self.info_font, height=1, wrap=tk.WORD,
                                    background=self.window.cget('background'), relief='flat',
                                    highlightthickness=0, width=40)
        self.lbl_lich_su_1.grid(row=0, column=0, sticky="w", pady=10)
        self.lbl_lich_su_1.configure(state='disabled')
        
        self.lbl_lich_su_2 = tk.Text(self.lich_su_frame, font=self.info_font, height=1, wrap=tk.WORD,
                                    background=self.window.cget('background'), relief='flat',
                                    highlightthickness=0, width=40)
        self.lbl_lich_su_2.grid(row=1, column=0, sticky="w", pady=10)
        self.lbl_lich_su_2.configure(state='disabled')
        
        # Frame cho thông tin trả giá hiện tại
        tra_gia_frame = ttk.LabelFrame(main_frame, text="Thông Tin Trả Giá", padding=10)
        tra_gia_frame.grid(row=4, column=0, columnspan=2, sticky="ew", padx=20, pady=5)
        tra_gia_frame.columnconfigure(0, weight=1)
        
        # Text widgets cho thông tin trả giá
        self.lbl_lan_tra = tk.Text(tra_gia_frame, font=self.header_font, height=1, wrap=tk.WORD,
                                  background=self.window.cget('background'), relief='flat',
                                  highlightthickness=0, width=60)
        self.lbl_lan_tra.grid(row=0, column=0, sticky="w", pady=5)
        self.lbl_lan_tra.insert('1.0', "Lần trả giá: 1")
        self.lbl_lan_tra.configure(state='disabled')
        
        self.lbl_nguoi_tra = tk.Text(tra_gia_frame, font=self.header_font, height=1, wrap=tk.WORD,
                                    background=self.window.cget('background'), relief='flat',
                                    highlightthickness=0, width=60)
        self.lbl_nguoi_tra.grid(row=1, column=0, sticky="w", pady=5)
        self.lbl_nguoi_tra.insert('1.0', "Người trả giá cao nhất: Chưa có")
        self.lbl_nguoi_tra.configure(state='disabled')
        
        self.lbl_gia_cao_nhat = tk.Text(tra_gia_frame, font=self.header_font, height=1, wrap=tk.WORD,
                                       background=self.window.cget('background'), relief='flat',
                                       highlightthickness=0, width=60)
        self.lbl_gia_cao_nhat.grid(row=2, column=0, sticky="w", pady=5)
        self.lbl_gia_cao_nhat.insert('1.0', f"Giá trả cao nhất: {format_currency(0)}")
        self.lbl_gia_cao_nhat.configure(state='disabled')
        
        # Frame cho đồng hồ đếm ngược
        time_frame = ttk.LabelFrame(main_frame, text="Thời gian trả giá còn lại", padding=10)
        time_frame.grid(row=5, column=0, columnspan=2, sticky="ew", padx=20, pady=10)
        time_frame.columnconfigure(0, weight=1)
        
        self.lbl_thoi_gian = ttk.Label(time_frame, text="60", font=('Helvetica', 48, 'bold'))
        self.lbl_thoi_gian.grid(row=0, column=0, pady=10)
        
        # Thiết lập style
        style = ttk.Style()
        style.configure('Title.TLabel', foreground='navy', font=self.title_font)
        style.configure('TLabelframe.Label', font=self.header_font)
        
        # Căn giữa các widget trong main_frame
        for i in range(6):
            main_frame.grid_rowconfigure(i, weight=1)
            
        # Căn giữa label thời gian
        time_frame.grid_columnconfigure(0, weight=1)
        self.lbl_thoi_gian.grid(sticky="n")
        
        # Khởi tạo danh sách lịch sử trả giá
        self.lich_su_tra_gia = []

    def cap_nhat_thong_tin(self, lan_tra, nguoi_tra, gia_tra):
        """Cập nhật thông tin trả giá"""
        # Cập nhật lần trả giá
        self.lbl_lan_tra.configure(state='normal')
        self.lbl_lan_tra.delete('1.0', tk.END)
        self.lbl_lan_tra.insert('1.0', f"Lần trả giá: {lan_tra}")
        self.lbl_lan_tra.configure(state='disabled')
        
        # Cập nhật người trả giá cao nhất
        self.lbl_nguoi_tra.configure(state='normal')
        self.lbl_nguoi_tra.delete('1.0', tk.END)
        self.lbl_nguoi_tra.insert('1.0', f"Người trả giá cao nhất: {nguoi_tra}")
        self.lbl_nguoi_tra.configure(state='disabled')
        
        # Cập nhật giá trả cao nhất
        self.lbl_gia_cao_nhat.configure(state='normal')
        self.lbl_gia_cao_nhat.delete('1.0', tk.END)
        self.lbl_gia_cao_nhat.insert('1.0', f"Giá trả cao nhất: {format_currency(gia_tra)}")
        self.lbl_gia_cao_nhat.configure(state='disabled')
        
        # Cập nhật lịch sử trả giá
        self.lich_su_tra_gia.append((lan_tra, gia_tra))
        if lan_tra >= 4:  # Chỉ hiển thị từ lần trả giá thứ 4
            self.lich_su_frame.grid()  # Hiển thị frame lịch sử
            # Hiển thị 2 lần trả giá gần nhất
            if len(self.lich_su_tra_gia) >= 2:
                lan_2, gia_2 = self.lich_su_tra_gia[-2]
                self.lbl_lich_su_1.configure(state='normal')
                self.lbl_lich_su_1.delete('1.0', tk.END)
                self.lbl_lich_su_1.insert('1.0', f"Lần {lan_2}: {format_currency(gia_2)}")
                self.lbl_lich_su_1.configure(state='disabled')
                
            if len(self.lich_su_tra_gia) >= 3:
                lan_3, gia_3 = self.lich_su_tra_gia[-3]
                self.lbl_lich_su_2.configure(state='normal')
                self.lbl_lich_su_2.delete('1.0', tk.END)
                self.lbl_lich_su_2.insert('1.0', f"Lần {lan_3}: {format_currency(gia_3)}")
                self.lbl_lich_su_2.configure(state='disabled')

    def cap_nhat_thoi_gian(self, thoi_gian):
        """Cập nhật đồng hồ đếm ngược"""
        self.lbl_thoi_gian.config(text=str(thoi_gian))
    
    def hien_thi_ket_qua(self, nguoi_thang, gia_thang):
        """Hiển thị kết quả cuối cùng"""
        # Xóa tất cả widgets hiện tại
        for widget in self.window.winfo_children():
            widget.destroy()
            
        # Main frame
        main_frame = ttk.Frame(self.window, padding="30")
        main_frame.grid(row=0, column=0, sticky="nsew")
        self.window.columnconfigure(0, weight=1)
        self.window.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        
        # Tiêu đề công ty
        title_text = tk.Text(main_frame, font=self.title_font, height=1, wrap=tk.WORD,
                           background=self.window.cget('background'), relief='flat',
                           highlightthickness=0, width=120)
        title_text.grid(row=0, column=0, pady=(0, 20))
        title_text.insert('1.0', "CÔNG TY ĐẤU GIÁ HỢP DANH HP.AUSERCO")
        title_text.configure(state='disabled')
        title_text.tag_configure('center', justify='center')
        title_text.tag_add('center', '1.0', 'end')
        
        # Thông tin tài sản
        tai_san_text = tk.Text(main_frame, font=self.header_font, height=2, wrap=tk.WORD,
                             background=self.window.cget('background'), relief='flat',
                             highlightthickness=0, width=120)
        tai_san_text.grid(row=1, column=0, pady=(0, 10))
        tai_san_text.insert('1.0', self.tai_san)
        tai_san_text.configure(state='disabled')
        tai_san_text.tag_configure('center', justify='center')
        tai_san_text.tag_add('center', '1.0', 'end')
        
        # Thông tin đấu giá viên
        dau_gia_vien_text = tk.Text(main_frame, font=('Helvetica', 24, 'bold'), height=1, wrap=tk.WORD,
                                   background=self.window.cget('background'), relief='flat',
                                   highlightthickness=0, width=80)
        dau_gia_vien_text.grid(row=2, column=0, pady=(0, 30))
        dau_gia_vien_text.insert('1.0', f"Đấu giá viên: {self.dau_gia_vien}")
        dau_gia_vien_text.configure(state='disabled')
        dau_gia_vien_text.tag_configure('center', justify='center')
        dau_gia_vien_text.tag_add('center', '1.0', 'end')
        
        # Tiêu đề kết quả
        ket_qua_text = tk.Text(main_frame, font=('Helvetica', 36, 'bold'), height=1, wrap=tk.WORD,
                              background=self.window.cget('background'), relief='flat',
                              highlightthickness=0, width=40, foreground='navy')
        ket_qua_text.grid(row=3, column=0, pady=(0, 40))
        ket_qua_text.insert('1.0', "KẾT QUẢ ĐẤU GIÁ")
        ket_qua_text.configure(state='disabled')
        ket_qua_text.tag_configure('center', justify='center')
        ket_qua_text.tag_add('center', '1.0', 'end')
        
        # Người trả giá cao nhất
        nguoi_thang_text = tk.Text(main_frame, font=('Helvetica', 24, 'bold'), height=1, wrap=tk.WORD,
                                  background=self.window.cget('background'), relief='flat',
                                  highlightthickness=0, width=80)
        nguoi_thang_text.grid(row=4, column=0, pady=(0, 20))
        nguoi_thang_text.insert('1.0', f"Người trả giá cao nhất: {nguoi_thang}")
        nguoi_thang_text.configure(state='disabled')
        nguoi_thang_text.tag_configure('center', justify='center')
        nguoi_thang_text.tag_add('center', '1.0', 'end')
        
        # Giá trả cao nhất
        gia_thang_text = tk.Text(main_frame, font=('Helvetica', 24, 'bold'), height=1, wrap=tk.WORD,
                                background=self.window.cget('background'), relief='flat',
                                highlightthickness=0, width=80)
        gia_thang_text.grid(row=5, column=0, pady=(0, 20))
        gia_thang_text.insert('1.0', f"Giá trả cao nhất: {format_currency(gia_thang)}")
        gia_thang_text.configure(state='disabled')
        gia_thang_text.tag_configure('center', justify='center')
        gia_thang_text.tag_add('center', '1.0', 'end')
        
        # Căn giữa các widget trong main_frame
        for i in range(6):
            main_frame.grid_rowconfigure(i, weight=1)

class Form2:
    def __init__(self, master, danh_sach_nguoi_tham_gia, gia_khoi_diem, buoc_gia, tai_san, dau_gia_vien):
        self.master = master
        master.title("Phiên Đấu Giá")
        master.minsize(800, 900)

        # Initialize variables first
        self.lan_tra_gia = 1
        self.gia_tra_cao_nhat_hien_tai = 0
        self.nguoi_tra_gia_cao_nhat_hien_tai = None
        self.ma_so_da_chon = None
        self.ma_so_lan_truoc = None
        
        # Khởi tạo biến cho đồng hồ đếm ngược
        self.dem_nguoc_dang_chay = False
        self.thoi_gian_con_lai = 60
        
        # Tạo cửa sổ thông tin đấu giá
        self.man_hinh_thong_tin = ThongTinDauGia(master, tai_san, gia_khoi_diem, buoc_gia, dau_gia_vien)

        # Convert all IDs to strings và giữ nguyên định dạng
        self.danh_sach_nguoi_tham_gia = [(str(item[0]), item[1], item[2]) for item in danh_sach_nguoi_tham_gia]
        self.gia_khoi_diem = gia_khoi_diem
        self.buoc_gia = buoc_gia

        # Apply custom styles
        setup_styles()

        # Main frame with padding
        main_frame = ttk.Frame(master, padding="10")
        main_frame.grid(row=0, column=0, sticky="nsew")

        # Configure grid weights
        master.columnconfigure(0, weight=1)
        master.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)

        # --- Header ---
        header_frame = ttk.Frame(main_frame)
        header_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        header_frame.columnconfigure(1, weight=1)

        self.lbl_lan_tra = ttk.Label(header_frame, text="Lần Trả Giá: 1", style='Header.TLabel')
        self.lbl_lan_tra.grid(row=0, column=0, padx=5, pady=5, sticky="w")

        starting_price_label = ttk.Label(header_frame,
                                       text=f"Giá Khởi Điểm: {format_currency(gia_khoi_diem)}",
                                       style='Currency.TLabel')
        starting_price_label.grid(row=0, column=1, padx=5, pady=5, sticky="e")

        step_price_label = ttk.Label(header_frame,
                                   text=f"Bước Giá: {format_currency(buoc_gia)}",
                                   style='Currency.TLabel')
        step_price_label.grid(row=1, column=1, padx=5, pady=5, sticky="e")

        # --- Bid Section ---
        self.group_tra_gia = ttk.LabelFrame(main_frame, text="Trả Giá", padding=10)
        self.group_tra_gia.grid(row=1, column=0, padx=5, pady=5, sticky="ew")
        self.group_tra_gia.columnconfigure(1, weight=1)

        # Thêm frame cho thời gian trả giá
        self.frame_thoi_gian = ttk.Frame(self.group_tra_gia)
        self.frame_thoi_gian.grid(row=0, column=3, rowspan=2, padx=5, pady=5, sticky="ne")

        # Thời gian trả giá còn lại
        thoi_gian_frame = ttk.Frame(self.frame_thoi_gian)
        thoi_gian_frame.grid(row=0, column=0, padx=5, pady=5, sticky="ew")

        self.lbl_thoi_gian = ttk.Label(thoi_gian_frame, text="Thời gian trả giá còn lại:")
        self.lbl_thoi_gian.grid(row=0, column=0, padx=5, pady=5, sticky="w")

        self.txt_thoi_gian = ttk.Entry(thoi_gian_frame, width=5)
        self.txt_thoi_gian.grid(row=0, column=1, padx=5, pady=5, sticky="w")
        self.txt_thoi_gian.insert(0, "60")
        self.txt_thoi_gian.configure(state="readonly")

        self.btn_bat_dau_thoi_gian = ttk.Button(thoi_gian_frame, text="Bắt đầu", command=self.bat_dau_dem_nguoc)
        self.btn_bat_dau_thoi_gian.grid(row=0, column=2, padx=5, pady=5, sticky="w")

        # Thêm nút Trả Giá vào frame_thoi_gian
        style = ttk.Style()
        style.configure('Big.TButton', font=('Helvetica', 12, 'bold'), padding=(20, 10))
        
        self.btn_tra_gia = ttk.Button(self.frame_thoi_gian, text="Trả Giá",
                                     command=self.tra_gia, style='Big.TButton')
        self.btn_tra_gia.grid(row=1, column=0, padx=5, pady=10, sticky="ew")

        # Frame chính cho phần nhập liệu
        input_frame = ttk.Frame(self.group_tra_gia)
        input_frame.grid(row=0, column=0, columnspan=2, sticky="ew")
        input_frame.columnconfigure(1, weight=1)

        # Mã số
        ttk.Label(input_frame, text="Mã Số:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.frame_ma_so = ttk.Frame(input_frame)
        self.frame_ma_so.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        self.ma_so_buttons = {}
        self.tao_ma_so_buttons(self.frame_ma_so, self.ma_so_buttons)

        # Tên
        ttk.Label(input_frame, text="Tên:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.txt_ten = ttk.Entry(input_frame, state="readonly")
        self.txt_ten.grid(row=1, column=1, padx=5, pady=5, sticky="ew")

        # Frame cho phần nhập giá trả
        self.frame_gia_tra = ttk.Frame(input_frame)
        self.frame_gia_tra.grid(row=2, column=0, columnspan=2, padx=5, pady=5, sticky="ew")
        self.frame_gia_tra.columnconfigure(1, weight=1)

        # Radio buttons cho lần đầu
        self.cach_tra_gia = tk.StringVar(value="buoc_gia")
        
        # Thêm radio button cho trả bằng giá khởi điểm (chỉ ở lần đầu)
        self.rad_gia_khoi_diem = ttk.Radiobutton(self.frame_gia_tra, text="Trả bằng giá khởi điểm",
                                                variable=self.cach_tra_gia, value="gia_khoi_diem",
                                                command=self.chuyen_doi_cach_tra_gia)
        self.rad_gia_khoi_diem.grid(row=0, column=0, padx=5, pady=5, sticky="w")
        
        self.rad_buoc_gia = ttk.Radiobutton(self.frame_gia_tra, text="Trả theo bước giá",
                                           variable=self.cach_tra_gia, value="buoc_gia",
                                           command=self.chuyen_doi_cach_tra_gia)
        self.rad_buoc_gia.grid(row=0, column=1, padx=5, pady=5, sticky="w")

        self.rad_gia_tu_chon = ttk.Radiobutton(self.frame_gia_tra, text="Nhập giá trả",
                                              variable=self.cach_tra_gia, value="gia_tu_chon",
                                              command=self.chuyen_doi_cach_tra_gia)
        self.rad_gia_tu_chon.grid(row=0, column=2, padx=5, pady=5, sticky="w")

        # Frame cho số bước giá
        self.frame_buoc_gia = ttk.Frame(self.frame_gia_tra)
        self.frame_buoc_gia.grid(row=1, column=0, columnspan=2, sticky="ew")
        self.frame_buoc_gia.columnconfigure(1, weight=1)

        ttk.Label(self.frame_buoc_gia, text="Số Bước Giá:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.num_so_buoc_gia = ttk.Spinbox(self.frame_buoc_gia, from_=1, to=100)
        self.num_so_buoc_gia.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        self.num_so_buoc_gia.set("1")
        
        # Frame cho giá tự chọn (chỉ hiển thị ở lần đầu)
        self.frame_gia_tu_chon = ttk.Frame(self.frame_gia_tra)
        self.frame_gia_tu_chon.grid(row=1, column=0, columnspan=2, sticky="ew")
        self.frame_gia_tu_chon.columnconfigure(1, weight=1)

        ttk.Label(self.frame_gia_tu_chon, text="Giá Trả:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.txt_gia_tra = ttk.Entry(self.frame_gia_tu_chon)
        self.txt_gia_tra.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        self.txt_gia_tra.bind('<KeyRelease>', self.validate_gia_tra)

        # Ẩn frame giá tự chọn ban đầu
        self.frame_gia_tu_chon.grid_remove()

        # --- Current Highest Bid Info ---
        self.group_ket_qua = ttk.LabelFrame(main_frame, text="Kết Quả Hiện Tại", padding=10)
        self.group_ket_qua.grid(row=2, column=0, padx=5, pady=10, sticky="ew")
        self.group_ket_qua.columnconfigure(0, weight=1)

        self.lbl_nguoi_cao_nhat = ttk.Label(self.group_ket_qua, text="Người Trả Cao Nhất: Chưa có", style='Header.TLabel')
        self.lbl_nguoi_cao_nhat.grid(row=0, column=0, padx=5, pady=5, sticky="w")

        self.lbl_gia_cao_nhat = ttk.Label(self.group_ket_qua,
                                         text=f"Giá Cao Nhất: {self.gia_tra_cao_nhat_hien_tai}",
                                         style='Currency.TLabel')
        self.lbl_gia_cao_nhat.grid(row=1, column=0, padx=5, pady=5, sticky="w")

        # --- Bid History ---
        self.group_lich_su = ttk.LabelFrame(main_frame, text="Lịch Sử Trả Giá", padding=10)
        self.group_lich_su.grid(row=3, column=0, padx=5, pady=10, sticky="nsew")
        self.group_lich_su.columnconfigure(0, weight=1)
        self.group_lich_su.rowconfigure(0, weight=1)

        # Create Treeview with scrollbar
        tree_frame = ttk.Frame(self.group_lich_su)
        tree_frame.grid(row=0, column=0, sticky="nsew")

        self.tree_lich_su = ttk.Treeview(tree_frame,
                                        columns=("lan_tra", "ma_so", "ten", "gia_tra"),
                                        show="headings",
                                        height=8)
        vsb = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree_lich_su.yview)
        hsb = ttk.Scrollbar(tree_frame, orient="horizontal", command=self.tree_lich_su.xview)
        self.tree_lich_su.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

        # Grid scrollbars
        self.tree_lich_su.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")

        tree_frame.columnconfigure(0, weight=1)
        tree_frame.rowconfigure(0, weight=1)

        # Configure columns
        self.tree_lich_su.heading("lan_tra", text="Lần Trả")
        self.tree_lich_su.heading("ma_so", text="Mã Số")
        self.tree_lich_su.heading("ten", text="Tên")
        self.tree_lich_su.heading("gia_tra", text="Giá Trả")
        self.tree_lich_su.column("lan_tra", width=80)
        self.tree_lich_su.column("ma_so", width=100)
        self.tree_lich_su.column("ten", width=200)
        self.tree_lich_su.column("gia_tra", width=150)

        # --- End Auction Button ---
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=4, column=0, pady=20, sticky="e")

        self.btn_xuat_file = ttk.Button(button_frame, text="Xuất File", command=self.xuat_file, style='Bold.TButton')
        self.btn_xuat_file.pack_forget()  # Ẩn nút xuất file ban đầu

        # Hiển thị nút kết thúc và nút xoá lần trả giá gần nhất
        self.btn_ket_thuc = ttk.Button(button_frame, text="Kết Thúc", command=self.ket_thuc, style='Bold.TButton')
        self.btn_xoa_lan_tra_gia = ttk.Button(button_frame, text="Xoá Lần Trả Giá Gần Nhất", command=self.xoa_lan_tra_gia_gan_nhat, style='Bold.TButton')
        self.btn_ket_thuc.pack(side=tk.RIGHT, padx=5)
        self.btn_xoa_lan_tra_gia.pack(side=tk.LEFT, padx=5)

        # Configure main_frame grid weights
        main_frame.rowconfigure(3, weight=1)

        # Bind keyboard shortcuts
        self.master.bind('<Return>', lambda e: self.handle_return_key())
        self.master.bind('<Escape>', lambda e: self.ket_thuc())

        # Center window
        center_window(master)

    def handle_return_key(self):
        """Handle Return key press based on current state"""
        if self.btn_xac_nhan_lan_dau['state'] != 'disabled':
            self.xac_nhan_lan_dau()
        elif self.btn_tra_gia['state'] != 'disabled':
            self.tra_gia()

    def validate_initial_bid(self, event=None):
        """Validate that input is a number"""
        try:
            # Get the current value and clean it
            value = self.txt_gia_tra_lan_dau.get().strip()
            # Remove any existing formatting
            value = value.replace(',', '').replace('$', '').replace('đồng', '').strip()

            if not value:  # If empty, just return
                return

            # Convert to float first to handle decimal points
            num = float(value)
            # Convert to integer (round down)
            num = int(num)

            if num < 0:
                messagebox.showerror("Lỗi", "Vui lòng nhập số dương")
                self.txt_gia_tra_lan_dau.delete(0, tk.END)
                return

            # Keep original number format
            self.txt_gia_tra_lan_dau.delete(0, tk.END)
            self.txt_gia_tra_lan_dau.insert(0, str(num))

        except ValueError:
            # Only show error if there's actually input
            if self.txt_gia_tra_lan_dau.get().strip():
                messagebox.showerror("Lỗi", "Vui lòng nhập số hợp lệ")
                self.txt_gia_tra_lan_dau.delete(0, tk.END)

    def tao_ma_so_buttons(self, parent_frame, button_dict):
        """Tạo các nút mã số trong một frame"""
        num_columns = min(8, len(self.danh_sach_nguoi_tham_gia))
        
        for i, (user_id, name, _) in enumerate(self.danh_sach_nguoi_tham_gia):
            row = i // num_columns
            col = i % num_columns
            
            btn_frame = ttk.Frame(parent_frame)
            btn_frame.grid(row=row, column=col, padx=1, pady=1, sticky="nsew")
            
            btn = ttk.Button(btn_frame, text=user_id, width=4,
                           command=lambda u=user_id, n=name: self.chon_ma_so(u, n))
            btn.pack(expand=True, fill="both")
            
            button_dict[user_id] = {
                'button': btn,
                'name': name
            }
            
    def chon_ma_so(self, ma_so, ten):
        """Xử lý khi chọn mã số"""
        if self.ma_so_da_chon:
            # Reset trạng thái nút trước đó nếu có
            self.ma_so_buttons[self.ma_so_da_chon]['button']['state'] = 'normal'
            
            # Cập nhật trạng thái nút mới
        self.ma_so_buttons[ma_so]['button']['state'] = 'disabled'
        self.ma_so_da_chon = ma_so

        self.txt_ten.configure(state="normal")
        self.txt_ten.delete(0, tk.END)
        self.txt_ten.insert(0, ten)
        self.txt_ten.configure(state="readonly")

    def xac_nhan_lan_dau(self):
        if not self.ma_so_da_chon:
            messagebox.showwarning("Cảnh báo", "Vui lòng chọn người tham gia")
            return

        try:
            gia_tra = int(self.txt_gia_tra.get().replace(',', ''))
        except ValueError:
            messagebox.showerror("Lỗi", "Vui lòng nhập giá trả hợp lệ")
            return

        if gia_tra < self.gia_khoi_diem:
            messagebox.showerror("Lỗi", "Giá trả phải lớn hơn hoặc bằng giá khởi điểm")
            return

        ten = self.ma_so_buttons[self.ma_so_da_chon]['name']

        self.gia_tra_cao_nhat_hien_tai = gia_tra
        self.nguoi_tra_gia_cao_nhat_hien_tai = ten

        self.tree_lich_su.insert('', 'end', values=(
            self.lan_tra_gia,
            self.ma_so_da_chon,
            ten,
            format_currency(gia_tra)
        ))

        self.lbl_nguoi_cao_nhat['text'] = f"Người Trả Cao Nhất: {ten}"
        self.lbl_gia_cao_nhat['text'] = f"Giá Cao Nhất: {format_currency(gia_tra)}"

        # Disable initial bid section
        for widget in self.group_lan_dau.winfo_children():
            if isinstance(widget, (ttk.Entry, ttk.Button, ttk.Spinbox)):
                widget["state"] = "disabled"
            elif isinstance(widget, ttk.Frame):
                for child in widget.winfo_children():
                    if isinstance(child, (ttk.Entry, ttk.Button, ttk.Spinbox)):
                        child["state"] = "disabled"

        # Enable subsequent bids section
        for info in self.ma_so_buttons.values():
            info['button']['state'] = 'normal'
        self.txt_ten.configure(state="normal")
        self.num_so_buoc_gia.configure(state="normal")
        self.btn_tra_gia.configure(state="normal")

        # Cập nhật danh sách người tham gia cho lần trả giá tiếp theo
        self.cap_nhat_danh_sach_nguoi_tham_gia()

    def tra_gia(self):
        """Xử lý khi người dùng trả giá"""
        if not self.ma_so_da_chon:
            messagebox.showwarning("Cảnh báo", "Vui lòng chọn người tham gia")
            return

        # Kiểm tra xem người này có phải là người vừa trả giá không
        if self.ma_so_da_chon == self.ma_so_lan_truoc:
            messagebox.showerror("Lỗi", "Bạn không thể trả giá 2 lần liên tiếp")
            return

        gia_tra_moi = 0
        if self.lan_tra_gia == 1:  # Lần trả giá đầu tiên
            if self.cach_tra_gia.get() == "gia_khoi_diem":
                gia_tra_moi = self.gia_khoi_diem
            elif self.cach_tra_gia.get() == "gia_tu_chon":
                try:
                    gia_tra_moi = int(self.txt_gia_tra.get().replace(',', ''))
                    if gia_tra_moi < self.gia_khoi_diem:
                        messagebox.showerror("Lỗi", "Giá trả phải lớn hơn hoặc bằng giá khởi điểm")
                        return
                except ValueError:
                    messagebox.showerror("Lỗi", "Vui lòng nhập giá trả hợp lệ")
                    return
            else:  # Trả theo bước giá
                try:
                    so_buoc_gia = int(self.num_so_buoc_gia.get())
                    gia_tra_moi = self.gia_khoi_diem + (so_buoc_gia * self.buoc_gia)
                except ValueError:
                    messagebox.showerror("Lỗi", "Vui lòng nhập số bước giá hợp lệ")
                    return
        else:  # Các lần trả giá sau
            try:
                so_buoc_gia = int(self.num_so_buoc_gia.get())
                gia_tra_moi = self.gia_tra_cao_nhat_hien_tai + (so_buoc_gia * self.buoc_gia)
            except ValueError:
                messagebox.showerror("Lỗi", "Vui lòng nhập số bước giá hợp lệ")
                return

        if gia_tra_moi <= self.gia_tra_cao_nhat_hien_tai:
            messagebox.showerror("Lỗi", "Giá trả mới phải cao hơn giá hiện tại")
            return

        # Lưu thông tin người trả giá trước khi cập nhật
        self.ma_so_lan_truoc = self.ma_so_da_chon
        ten_nguoi_tra = self.ma_so_buttons[self.ma_so_da_chon]['name']
        
        # Cập nhật thông tin trả giá
        self.gia_tra_cao_nhat_hien_tai = gia_tra_moi
        self.nguoi_tra_gia_cao_nhat_hien_tai = ten_nguoi_tra

        # Thêm vào lịch sử
        self.tree_lich_su.insert('', 'end', values=(
            self.lan_tra_gia,
            self.ma_so_da_chon,
            ten_nguoi_tra,
            format_currency(gia_tra_moi)
        ))

        # Cập nhật giao diện chính
        self.lbl_nguoi_cao_nhat['text'] = f"Người Trả Cao Nhất: {ten_nguoi_tra}"
        self.lbl_gia_cao_nhat['text'] = f"Giá Cao Nhất: {format_currency(gia_tra_moi)}"
        
        # Cập nhật màn hình thông tin
        self.man_hinh_thong_tin.cap_nhat_thong_tin(
            self.lan_tra_gia,
            ten_nguoi_tra,
            gia_tra_moi
        )

        # Tăng số lần trả giá và cập nhật label
        self.lan_tra_gia += 1
        self.lbl_lan_tra['text'] = f"Lần Trả Giá: {self.lan_tra_gia}"

        # Sau lần trả giá đầu tiên, ẩn các radio button và chỉ để lại trả theo bước giá
        if self.lan_tra_gia == 2:
            self.rad_gia_khoi_diem.grid_remove()
            self.rad_gia_tu_chon.grid_remove()
            self.frame_gia_tu_chon.grid_remove()
            self.cach_tra_gia.set("buoc_gia")
            self.frame_buoc_gia.grid()

        # Reset thời gian sau khi trả giá và cập nhật cả hai màn hình
        self.thoi_gian_con_lai = 60
        self.txt_thoi_gian.configure(state="normal")
        self.txt_thoi_gian.delete(0, tk.END)
        self.txt_thoi_gian.insert(0, "60")
        self.txt_thoi_gian.configure(state="readonly")
        self.man_hinh_thong_tin.cap_nhat_thoi_gian(60)  # Cập nhật màn hình thông tin
        self.btn_bat_dau_thoi_gian.config(text="Bắt đầu")
        self.dem_nguoc_dang_chay = False

        # Cập nhật danh sách người tham gia cho lần trả giá tiếp theo
        self.cap_nhat_danh_sach_nguoi_tham_gia()

    def cap_nhat_danh_sach_nguoi_tham_gia(self):
        """Cập nhật danh sách người tham gia cho lần trả giá tiếp theo"""
        # Cập nhật trạng thái các nút
        for ma_so, info in self.ma_so_buttons.items():
            if ma_so == self.ma_so_da_chon:  # Chỉ làm mờ mã số của người trả giá lần trước
                info['button']['state'] = 'disabled'
            else:
                info['button']['state'] = 'normal'
        
        # Reset mã số đã chọn và trạng thái các trường nhập liệu
        self.ma_so_da_chon = None
        self.txt_ten.configure(state="normal")
        self.txt_ten.delete(0, tk.END)
        self.txt_ten.configure(state="readonly")
        self.num_so_buoc_gia.set("1")
        if hasattr(self, 'txt_gia_tra'):
            self.txt_gia_tra.delete(0, tk.END)

    def ket_thuc(self):
        if messagebox.askyesno("Xác nhận", "Bạn có chắc chắn muốn kết thúc phiên đấu giá?"):
            messagebox.showinfo("Kết quả đấu giá",
                              f"Phiên đấu giá đã kết thúc!\n\n" +
                              f"Người trả giá cao nhất: {self.nguoi_tra_gia_cao_nhat_hien_tai}\n" +
                              f"Giá trả cao nhất: {format_currency(self.gia_tra_cao_nhat_hien_tai)}")
            
            # Cập nhật màn hình thông tin
            self.man_hinh_thong_tin.hien_thi_ket_qua(
                self.nguoi_tra_gia_cao_nhat_hien_tai,
                self.gia_tra_cao_nhat_hien_tai
            )
            
            # Ẩn các nút không cần thiết
            self.btn_ket_thuc.pack_forget()
            self.btn_xoa_lan_tra_gia.pack_forget()
            
            # Hiển thị nút xuất file
            self.btn_xuat_file.pack(side=tk.RIGHT, padx=5)

    def chuyen_doi_cach_tra_gia(self):
        """Chuyển đổi giữa các cách trả giá"""
        if self.cach_tra_gia.get() == "buoc_gia":
            self.frame_buoc_gia.grid()
            self.frame_gia_tu_chon.grid_remove()
        elif self.cach_tra_gia.get() == "gia_tu_chon":
            self.frame_buoc_gia.grid_remove()
            self.frame_gia_tu_chon.grid()
        else:  # gia_khoi_diem
            self.frame_buoc_gia.grid_remove()
            self.frame_gia_tu_chon.grid_remove()

    def validate_gia_tra(self, event=None):
        # Implementation of validate_gia_tra method
        pass

    def xoa_lan_tra_gia_gan_nhat(self):
        """Xoá lần trả giá gần nhất với xác nhận"""
        if not self.tree_lich_su.get_children():
            messagebox.showwarning("Cảnh báo", "Không có lần trả giá nào để xoá")
            return

        if not messagebox.askyesno("Xác nhận", "Bạn có chắc chắn muốn xoá lần trả giá gần nhất?"):
            return

        # Xoá lần trả giá cuối cùng
        last_item = self.tree_lich_su.get_children()[-1]
        self.tree_lich_su.delete(last_item)

        # Cập nhật lại lần trả giá
        self.lan_tra_gia -= 1
        self.lbl_lan_tra['text'] = f"Lần Trả Giá: {self.lan_tra_gia}"

        # Cập nhật lại giá cao nhất và người trả giá cao nhất
        if self.tree_lich_su.get_children():
            last_values = self.tree_lich_su.item(self.tree_lich_su.get_children()[-1])['values']
            self.gia_tra_cao_nhat_hien_tai = int(last_values[3].replace(',', '').replace(' đồng', ''))
            self.nguoi_tra_gia_cao_nhat_hien_tai = last_values[2]
            self.lbl_nguoi_cao_nhat['text'] = f"Người Trả Cao Nhất: {self.nguoi_tra_gia_cao_nhat_hien_tai}"
            self.lbl_gia_cao_nhat['text'] = f"Giá Cao Nhất: {format_currency(self.gia_tra_cao_nhat_hien_tai)}"
            # Đảm bảo người trả giá lần trước không thể trả giá tiếp theo
            self.ma_so_lan_truoc = last_values[1]
        else:
            self.gia_tra_cao_nhat_hien_tai = 0
            self.nguoi_tra_gia_cao_nhat_hien_tai = None
            self.lbl_nguoi_cao_nhat['text'] = "Người Trả Cao Nhất: Chưa có"
            self.lbl_gia_cao_nhat['text'] = "Giá Cao Nhất: 0 đồng"
            self.ma_so_lan_truoc = None

        # Cập nhật trạng thái các nút
        for ma_so, info in self.ma_so_buttons.items():
            if ma_so == self.ma_so_lan_truoc:  # Chỉ làm mờ mã số của người trả giá lần trước
                info['button']['state'] = 'disabled'
            else:
                info['button']['state'] = 'normal'

    def xuat_file(self):
        file_path = filedialog.asksaveasfilename(defaultextension=".xlsx", filetypes=[("Excel files", "*.xlsx")])
        if not file_path:
            return

        try:
            # Lấy dữ liệu từ Treeview
            data = []
            for row_id in self.tree_lich_su.get_children():
                row = self.tree_lich_su.item(row_id)['values']
                data.append(row)

            # Tạo DataFrame và ghi ra file Excel
            df = pd.DataFrame(data, columns=["Lần Trả", "Mã Số", "Tên", "Giá Trả"])
            df.to_excel(file_path, index=False)
            messagebox.showinfo("Thành công", "Xuất file thành công!")

            # Đảm bảo người trả giá lần trước không thể trả giá tiếp theo
            self.ma_so_lan_truoc = None
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể xuất file: {e}")

    def bat_dau_dem_nguoc(self):
        if not self.dem_nguoc_dang_chay:
            self.dem_nguoc_dang_chay = True
            self.btn_bat_dau_thoi_gian.config(text="Tạm dừng")
            self.dem_nguoc()
        else:
            self.dem_nguoc_dang_chay = False
            self.btn_bat_dau_thoi_gian.config(text="Bắt đầu")

    def dem_nguoc(self):
        if self.dem_nguoc_dang_chay and self.thoi_gian_con_lai > 0:
            self.thoi_gian_con_lai -= 1
            self.txt_thoi_gian.configure(state="normal")
            self.txt_thoi_gian.delete(0, tk.END)
            self.txt_thoi_gian.insert(0, str(self.thoi_gian_con_lai))
            self.txt_thoi_gian.configure(state="readonly")
            
            # Cập nhật màn hình thông tin
            self.man_hinh_thong_tin.cap_nhat_thoi_gian(self.thoi_gian_con_lai)
            
            self.master.after(1000, self.dem_nguoc)
        elif self.thoi_gian_con_lai <= 0:
            self.dem_nguoc_dang_chay = False
            self.btn_bat_dau_thoi_gian.config(text="Bắt đầu")

class Form1:
    def __init__(self, master):
        self.master = master
        master.title("Hệ Thống Đấu Giá")
        master.minsize(600, 700)

        # Apply custom styles
        setup_styles()

        # Main frame with padding
        main_frame = ttk.Frame(master, padding="10")
        main_frame.grid(row=0, column=0, sticky="nsew")

        # Configure grid weights
        master.columnconfigure(0, weight=1)
        master.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)

        # --- Header ---
        header_label = ttk.Label(main_frame, text="Thiết Lập Đấu Giá", style='Header.TLabel')
        header_label.grid(row=0, column=0, pady=(0, 20))

        # --- Thông tin chung ---
        self.group_thong_tin_chung = ttk.LabelFrame(main_frame, text="Thông Tin Chung", padding=10)
        self.group_thong_tin_chung.grid(row=1, column=0, padx=5, pady=5, sticky="ew")
        self.group_thong_tin_chung.columnconfigure(1, weight=1)

        ttk.Label(self.group_thong_tin_chung, text="Giá Khởi Điểm:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.txt_gia_khoi_diem = ttk.Entry(self.group_thong_tin_chung)
        self.txt_gia_khoi_diem.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        self.txt_gia_khoi_diem.bind('<KeyRelease>', self.format_gia_khoi_diem)

        ttk.Label(self.group_thong_tin_chung, text="Bước Giá:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.num_buoc_gia = ttk.Spinbox(self.group_thong_tin_chung, from_=1000000, to=1000000000, increment=1000000)
        self.num_buoc_gia.grid(row=1, column=1, padx=5, pady=5, sticky="ew")
        self.num_buoc_gia.bind('<KeyRelease>', self.format_buoc_gia)

        # Thêm trường nhập liệu cho Tài sản đấu giá
        ttk.Label(self.group_thong_tin_chung, text="Tài Sản Đấu Giá:").grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.txt_tai_san = ttk.Entry(self.group_thong_tin_chung)
        self.txt_tai_san.grid(row=2, column=1, padx=5, pady=5, sticky="ew")

        # Thêm dropdown cho Đấu giá viên
        ttk.Label(self.group_thong_tin_chung, text="Đấu Giá Viên:").grid(row=3, column=0, padx=5, pady=5, sticky="w")
        self.cbo_dau_gia_vien = ttk.Combobox(self.group_thong_tin_chung, values=["Phạm Tuấn", "Nguyễn Văn Khoán"])
        self.cbo_dau_gia_vien.grid(row=3, column=1, padx=5, pady=5, sticky="ew")
        self.cbo_dau_gia_vien.set("Phạm Tuấn")

        # --- Nhập thông tin người tham gia ---
        self.group_nhap_thong_tin = ttk.LabelFrame(main_frame, text="Thông Tin Người Tham Gia", padding=10)
        self.group_nhap_thong_tin.grid(row=2, column=0, padx=5, pady=10, sticky="ew")
        self.group_nhap_thong_tin.columnconfigure(1, weight=1)

        ttk.Label(self.group_nhap_thong_tin, text="Mã Số:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.txt_ma_so = ttk.Entry(self.group_nhap_thong_tin)
        self.txt_ma_so.grid(row=0, column=1, padx=5, pady=5, sticky="ew")

        ttk.Label(self.group_nhap_thong_tin, text="Tên:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.txt_ten = ttk.Entry(self.group_nhap_thong_tin)
        self.txt_ten.grid(row=1, column=1, padx=5, pady=5, sticky="ew")

        ttk.Label(self.group_nhap_thong_tin, text="CCCD/DKKD:").grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.txt_cccd = ttk.Entry(self.group_nhap_thong_tin)
        self.txt_cccd.grid(row=2, column=1, padx=5, pady=5, sticky="ew")

        ttk.Label(self.group_nhap_thong_tin, text="Nơi Cấp:").grid(row=3, column=0, padx=5, pady=5, sticky="w")
        self.txt_noi_cap = ttk.Entry(self.group_nhap_thong_tin)
        self.txt_noi_cap.grid(row=3, column=1, padx=5, pady=5, sticky="ew")

        ttk.Label(self.group_nhap_thong_tin, text="Địa Chỉ:").grid(row=4, column=0, padx=5, pady=5, sticky="w")
        self.txt_dia_chi = ttk.Entry(self.group_nhap_thong_tin)
        self.txt_dia_chi.grid(row=4, column=1, padx=5, pady=5, sticky="ew")

        btn_frame = ttk.Frame(self.group_nhap_thong_tin)
        btn_frame.grid(row=5, column=0, columnspan=2, pady=10)

        self.btn_them = ttk.Button(btn_frame, text="Thêm", command=self.them_nguoi_tham_gia, style='Bold.TButton')
        self.btn_them.pack(side=tk.LEFT, padx=5)

        self.btn_xoa = ttk.Button(btn_frame, text="Xóa", command=self.xoa_nguoi_tham_gia, style='Bold.TButton')
        self.btn_xoa.pack(side=tk.LEFT, padx=5)

        self.btn_import = ttk.Button(btn_frame, text="Import từ Excel", command=self.import_from_excel, style='Bold.TButton')
        self.btn_import.pack(side=tk.LEFT, padx=5)

        # --- Danh sách người tham gia ---
        self.group_danh_sach = ttk.LabelFrame(main_frame, text="Danh Sách Người Tham Gia", padding=10)
        self.group_danh_sach.grid(row=3, column=0, padx=5, pady=10, sticky="nsew")
        self.group_danh_sach.columnconfigure(0, weight=1)
        self.group_danh_sach.rowconfigure(0, weight=1)

        # Create Treeview with scrollbar
        tree_frame = ttk.Frame(self.group_danh_sach)
        tree_frame.grid(row=0, column=0, sticky="nsew")

        self.tree = ttk.Treeview(tree_frame, columns=("ma_so", "ten", "cccd", "noi_cap", "dia_chi"), show="headings", height=8)
        vsb = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        hsb = ttk.Scrollbar(tree_frame, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

        # Grid scrollbars
        self.tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")

        tree_frame.columnconfigure(0, weight=1)
        tree_frame.rowconfigure(0, weight=1)

        # Configure Treeview columns
        self.tree.heading("ma_so", text="Mã Số")
        self.tree.heading("ten", text="Tên")
        self.tree.heading("cccd", text="CCCD/DKKD")
        self.tree.heading("noi_cap", text="Nơi Cấp")
        self.tree.heading("dia_chi", text="Địa Chỉ")
        self.tree.column("ma_so", width=100)
        self.tree.column("ten", width=150)
        self.tree.column("cccd", width=150)
        self.tree.column("noi_cap", width=150)
        self.tree.column("dia_chi", width=200)

        # --- Start Button ---
        self.btn_bat_dau = ttk.Button(main_frame, text="Bắt Đầu Đấu Giá", command=self.bat_dau_dau_gia, style='Bold.TButton')
        self.btn_bat_dau.grid(row=4, column=0, pady=20)

        # Configure main_frame grid weights
        main_frame.rowconfigure(3, weight=1)

        # Bind keyboard shortcuts
        self.master.bind('<Return>', lambda e: self.them_nguoi_tham_gia())
        self.master.bind('<Control-s>', lambda e: self.bat_dau_dau_gia())
        self.master.bind('<Delete>', lambda e: self.xoa_nguoi_tham_gia())

        # Center window
        center_window(master)

    def format_gia_khoi_diem(self, event=None):
        """Định dạng Giá khởi điểm để phân cách hàng nghìn bằng dấu chấm"""
        try:
            value = self.txt_gia_khoi_diem.get().replace('.', '')
            if value:
                formatted_value = f"{int(value):,}".replace(',', '.')
                self.txt_gia_khoi_diem.delete(0, tk.END)
                self.txt_gia_khoi_diem.insert(0, formatted_value)
        except ValueError:
            pass

    def format_buoc_gia(self, event=None):
        """Định dạng Bước giá để phân cách hàng nghìn bằng dấu chấm"""
        try:
            value = self.num_buoc_gia.get().replace('.', '')
            if value:
                formatted_value = f"{int(value):,}".replace(',', '.')
                self.num_buoc_gia.delete(0, tk.END)
                self.num_buoc_gia.insert(0, formatted_value)
        except ValueError:
            pass

    def them_nguoi_tham_gia(self):
        ma_so = self.txt_ma_so.get().strip()
        ten = self.txt_ten.get().strip()
        cccd = self.txt_cccd.get().strip()
        noi_cap = self.txt_noi_cap.get().strip()
        dia_chi = self.txt_dia_chi.get().strip()

        # Cho phép thêm người tham gia mà không cần nhập đầy đủ thông tin
        if not ma_so or not ten:
            messagebox.showwarning("Cảnh báo", "Vui lòng nhập ít nhất mã số và tên")
            return

        existing_ids = [self.tree.item(child)['values'][0] for child in self.tree.get_children()]
        if ma_so in existing_ids:
            messagebox.showerror("Lỗi", "Mã số đã tồn tại!")
            return

        self.tree.insert('', 'end', values=(ma_so, ten, cccd, noi_cap, dia_chi))
        for entry in [self.txt_ma_so, self.txt_ten, self.txt_cccd, self.txt_noi_cap, self.txt_dia_chi]:
            entry.delete(0, tk.END)
        self.txt_ma_so.focus()

    def xoa_nguoi_tham_gia(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showinfo("Thông báo", "Vui lòng chọn người tham gia để xóa")
            return

        if messagebox.askyesno("Xác nhận", "Bạn có chắc chắn muốn xóa (các) người tham gia đã chọn?"):
            for item in selected_items:
                self.tree.delete(item)

    def bat_dau_dau_gia(self):
        try:
            # Loại bỏ dấu chấm trước khi chuyển đổi thành số nguyên
            gia_khoi_diem = int(self.txt_gia_khoi_diem.get().replace('.', ''))
            if gia_khoi_diem <= 0:
                messagebox.showerror("Lỗi", "Giá khởi điểm phải là số dương")
                return
        except ValueError:
            messagebox.showerror("Lỗi", "Vui lòng nhập giá khởi điểm hợp lệ")
            return

        buoc_gia = int(self.num_buoc_gia.get().replace('.', ''))
        tai_san = self.txt_tai_san.get().strip()
        dau_gia_vien = self.cbo_dau_gia_vien.get()
        
        if not tai_san:
            messagebox.showwarning("Cảnh báo", "Vui lòng nhập thông tin tài sản đấu giá")
            return
            
        danh_sach_nguoi_tham_gia = []
        for item in self.tree.get_children():
            danh_sach_nguoi_tham_gia.append(self.tree.item(item)['values'])

        if not danh_sach_nguoi_tham_gia:
            messagebox.showwarning("Cảnh báo", "Vui lòng thêm ít nhất một người tham gia")
            return

        self.master.destroy()
        root_dau_gia = tk.Tk()
        form_dau_gia = Form2(root_dau_gia, danh_sach_nguoi_tham_gia, gia_khoi_diem, buoc_gia, tai_san, dau_gia_vien)
        root_dau_gia.mainloop()

    def import_from_excel(self):
        file_path = filedialog.askopenfilename(filetypes=[("Excel files", "*.xlsx *.xls")])
        if not file_path:
            return

        try:
            df = pd.read_excel(file_path)
            for index, row in df.iterrows():
                ma_so = str(row['Mã Số'])
                ten = row['Tên']
                cccd = row['CCCD/DKKD']
                noi_cap = row['Nơi Cấp']
                dia_chi = row['Địa Chỉ']

                existing_ids = [self.tree.item(child)['values'][0] for child in self.tree.get_children()]
                if ma_so in existing_ids:
                    continue

                self.tree.insert('', 'end', values=(ma_so, ten, cccd, noi_cap, dia_chi))
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file Excel: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    form1_instance = Form1(root)
    root.mainloop()
